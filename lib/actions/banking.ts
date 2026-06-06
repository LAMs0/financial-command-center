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
import { encryptSecret } from "@/lib/crypto";
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
  // Dedup POR CUENTA (no por institución): al reconectar el mismo banco
  // agregamos solo las cuentas nuevas (p. ej. una de ahorro que no se compartió
  // la primera vez) sin duplicar las que ya existen ni sus transacciones.
  const existing = await prisma.financialAccount.findMany({
    where: { userId, institution: institution.name },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((account) => account.name));
  const newAccounts = accounts.filter((account) => !existingNames.has(account.name));

  if (newAccounts.length === 0) {
    return { error: `${institution.name} ya esta conectado (sin cuentas nuevas).` };
  }

  // Solo creamos las cuentas nuevas. El Map resultante hace que más abajo solo
  // se inserten las transacciones de ESAS cuentas (las viejas no se tocan).
  const idByExternal = new Map<string, string>();
  for (const account of newAccounts) {
    const created = await prisma.financialAccount.create({
      data: {
        userId,
        name: account.name,
        institution: institution.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        color: institution.color,
        lastUpdated: new Date(),
      },
    });
    idByExternal.set(account.externalId, created.id);
  }

  if (transactions.length > 0) {
    await prisma.transaction.createMany({
      data: transactions
        .filter((transaction) => idByExternal.has(transaction.accountExternalId))
        .map((transaction) => ({
          userId,
          accountId: idByExternal.get(transaction.accountExternalId)!,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: new Date(transaction.date),
          currency: transaction.currency,
        })),
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
