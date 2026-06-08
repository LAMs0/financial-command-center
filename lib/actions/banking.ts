"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getBankProvider } from "@/lib/banking";
import {
  createLinkToken as plaidCreateLinkToken,
  exchangePublicToken as plaidExchangePublicToken,
  syncByAccessToken as plaidSyncByAccessToken,
} from "@/lib/banking/plaid-provider";
import type { BankInstitution, BankSyncResult } from "@/lib/banking";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { notifyMonitoring } from "@/lib/logger";

const DATA_PATHS = ["/dashboard", "/accounts", "/transactions", "/analytics"];

function revalidateAll() {
  for (const path of DATA_PATHS) revalidatePath(path);
}

/*
  Persiste un resultado de sincronización (cuentas + transacciones) para un
  usuario. Compartido por el flujo "direct" (mock) y el flujo "link" (Plaid).
  Devuelve un error legible si la institución ya estaba conectada.
*/
async function persistSyncResult(
  userId: string,
  { institution, accounts, transactions }: BankSyncResult
): Promise<{ error?: string; connected?: string }> {
  // IDEMPOTENTE por `externalId` (el id de la cuenta/movimiento en el
  // proveedor). Re-sincronizar el mismo banco ahora:
  //   - actualiza balances de las cuentas existentes,
  //   - agrega cuentas nuevas (p. ej. una savings que no se compartió antes),
  //   - inserta solo los movimientos nuevos (skipDuplicates por unique),
  // sin duplicar nada. Esto habilita un futuro botón "Re-sincronizar".
  const idByExternal = new Map<string, string>();
  for (const account of accounts) {
    const saved = await prisma.financialAccount.upsert({
      where: { userId_externalId: { userId, externalId: account.externalId } },
      update: {
        // No tocamos `color` ni `institution` en update: se fijan al crear y
        // se conservan estables entre re-sincronizaciones.
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        externalId: account.externalId,
        name: account.name,
        institution: institution.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        color: institution.color,
        lastUpdated: new Date(),
      },
    });
    idByExternal.set(account.externalId, saved.id);
  }

  if (transactions.length > 0) {
    // createMany + skipDuplicates: los movimientos ya importados (mismo
    // userId+externalId) se omiten automáticamente. Solo entran los nuevos.
    await prisma.transaction.createMany({
      data: transactions
        .filter((transaction) => idByExternal.has(transaction.accountExternalId))
        .map((transaction) => ({
          userId,
          externalId: transaction.externalId,
          accountId: idByExternal.get(transaction.accountExternalId)!,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: new Date(transaction.date),
          currency: transaction.currency,
        })),
      skipDuplicates: true,
    });
  }

  await prisma.user
    .update({ where: { id: userId }, data: { usingSampleData: false } })
    .catch((error) => notifyMonitoring("banking.sample_flag_update_failed", error, { userId }));

  revalidateAll();
  return { connected: institution.name };
}

// ─── Flujo "direct" (mock): conectar por id de institución ────────────────

export async function connectInstitution(
  institutionId: string
): Promise<{ error?: string; connected?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const provider = getBankProvider();
    const result = await provider.sync(institutionId);
    return await persistSyncResult(userId, result);
  } catch (error) {
    await notifyMonitoring("banking.connect_failed", error, { institutionId, userId });
    return { error: "No se pudo conectar la institucion. Intentalo de nuevo." };
  }
}

// ─── Flujo "link" (Plaid): link token → exchange → sync ───────────────────

/** Paso 1: el cliente pide un link_token para abrir Plaid Link. */
export async function createPlaidLinkToken(): Promise<{ error?: string; linkToken?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const linkToken = await plaidCreateLinkToken(userId);
    return { linkToken };
  } catch (error) {
    await notifyMonitoring("banking.link_token_failed", error, { userId });
    return { error: "No se pudo iniciar la conexión con el banco. Intentalo de nuevo." };
  }
}

/*
  Paso 2+3: el cliente entrega el public_token que devolvió Plaid Link. Aquí:
  canjeamos por access_token, lo ciframos y guardamos en BankConnection,
  sincronizamos cuentas/transacciones y las persistimos.
*/
export async function connectPlaidItem(
  publicToken: string
): Promise<{ error?: string; connected?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  let institution: BankInstitution | null = null;
  try {
    const exchange = await plaidExchangePublicToken(publicToken);
    institution = exchange.institution;

    // Guardar la conexión con el access_token CIFRADO (nunca en texto plano).
    await prisma.bankConnection.upsert({
      where: {
        userId_provider_institutionId: {
          userId,
          provider: "plaid",
          institutionId: institution.id,
        },
      },
      create: {
        userId,
        provider: "plaid",
        institutionId: institution.id,
        institutionName: institution.name,
        accessTokenCipher: encryptSecret(exchange.accessToken),
        itemId: exchange.itemId,
        status: "active",
        lastSyncedAt: new Date(),
      },
      update: {
        accessTokenCipher: encryptSecret(exchange.accessToken),
        itemId: exchange.itemId,
        status: "active",
        lastSyncedAt: new Date(),
      },
    });

    const result = await plaidSyncByAccessToken(exchange.accessToken, institution);
    return await persistSyncResult(userId, result);
  } catch (error) {
    await notifyMonitoring("banking.plaid_connect_failed", error, {
      userId,
      institution: institution?.name,
    });
    return { error: "No se pudo conectar el banco. Intentalo de nuevo." };
  }
}

/*
  Re-sincronizar: usa el access_token CIFRADO ya guardado (BankConnection) para
  volver a traer cuentas + movimientos de Plaid. Gracias al guardado idempotente
  (persistSyncResult), esto actualiza balances y agrega lo nuevo sin duplicar.
  Solo aplica a conexiones de Plaid (el mock no guarda BankConnection).
*/
export async function resyncInstitution(
  institution: string
): Promise<{ error?: string; connected?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const connection = await prisma.bankConnection.findFirst({
      where: { userId, institutionName: institution, provider: "plaid", status: "active" },
    });
    if (!connection) {
      return { error: "Esta institución no se puede re-sincronizar." };
    }

    const accessToken = decryptSecret(connection.accessTokenCipher);
    const meta: BankInstitution = {
      id: connection.institutionId,
      name: connection.institutionName,
      color: "#10b981", // create-only en persistSyncResult; no pisa el color real
      country: "US",
    };

    const result = await plaidSyncByAccessToken(accessToken, meta);
    const saved = await persistSyncResult(userId, result);

    await prisma.bankConnection
      .update({ where: { id: connection.id }, data: { lastSyncedAt: new Date() } })
      .catch((error) => notifyMonitoring("banking.resync_timestamp_failed", error, { userId }));

    return saved;
  } catch (error) {
    await notifyMonitoring("banking.resync_failed", error, { institution, userId });
    return { error: "No se pudo re-sincronizar. Intentalo de nuevo." };
  }
}

// ─── Desconectar ──────────────────────────────────────────────────────────

export async function disconnectInstitution(
  institution: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const accounts = await prisma.financialAccount.findMany({
      where: { userId, institution },
      select: { id: true },
    });
    const accountIds = accounts.map((account) => account.id);
    if (accountIds.length === 0) return { error: "Institucion no encontrada." };

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId, accountId: { in: accountIds } } }),
      prisma.financialAccount.deleteMany({ where: { userId, institution } }),
      // Si vino de Plaid, también soltamos la conexión guardada (por nombre).
      prisma.bankConnection.deleteMany({ where: { userId, institutionName: institution } }),
    ]);

    revalidateAll();
    return {};
  } catch (error) {
    await notifyMonitoring("banking.disconnect_failed", error, { institution, userId });
    return { error: "No se pudo desconectar. Intentalo de nuevo." };
  }
}
