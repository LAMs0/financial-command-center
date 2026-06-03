"use server";

/*
  lib/actions/banking.ts — Server Actions de conectividad bancaria.
  ─────────────────────────────────────────────────────────────────
  Orquestan el proveedor (lib/banking) con la persistencia (Prisma):

    connectInstitution(id)     → sincroniza una institución y guarda sus
                                 cuentas + transacciones en el espacio del
                                 usuario (tablas FinancialAccount/Transaction).
    disconnectInstitution(name)→ elimina las cuentas de esa institución y sus
                                 transacciones.

  Reutilizamos las tablas existentes (sin migración de DB): una institución
  "conectada" es simplemente el conjunto de FinancialAccount cuyo campo
  `institution` coincide. Esto mantiene el dashboard/analytics funcionando sin
  cambios. Cuando se añada Plaid real, se introducirá un modelo BankConnection
  para guardar el access_token cifrado (ver lib/banking/plaid-provider.ts).
*/

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getBankProvider } from "@/lib/banking";

const DATA_PATHS = ["/dashboard", "/accounts", "/transactions", "/analytics"];
function revalidateAll() {
  for (const path of DATA_PATHS) revalidatePath(path);
}

export async function connectInstitution(
  institutionId: string
): Promise<{ error?: string; connected?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const provider = getBankProvider();
    const { institution, accounts, transactions } = await provider.sync(institutionId);

    // Evitar duplicados: si ya hay cuentas de esta institución, no reconectar.
    const existing = await prisma.financialAccount.count({
      where: { userId, institution: institution.name },
    });
    if (existing > 0) {
      return { error: `${institution.name} ya está conectado.` };
    }

    // 1) Crear cuentas y mapear externalId → id real de la DB.
    const idByExternal = new Map<string, string>();
    for (const acc of accounts) {
      const created = await prisma.financialAccount.create({
        data: {
          userId,
          name: acc.name,
          institution: institution.name,
          type: acc.type,
          balance: acc.balance,
          currency: acc.currency,
          color: institution.color,
          lastUpdated: new Date(),
        },
      });
      idByExternal.set(acc.externalId, created.id);
    }

    // 2) Crear transacciones apuntando a las cuentas recién creadas.
    if (transactions.length > 0) {
      await prisma.transaction.createMany({
        data: transactions
          .filter((t) => idByExternal.has(t.accountExternalId))
          .map((t) => ({
            userId,
            accountId: idByExternal.get(t.accountExternalId)!,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: new Date(t.date),
            currency: t.currency,
          })),
      });
    }

    // Conectar datos reales-de-banco implica que ya no son "datos de ejemplo".
    await prisma.user
      .update({ where: { id: userId }, data: { usingSampleData: false } })
      .catch(() => {});

    revalidateAll();
    return { connected: institution.name };
  } catch (err) {
    console.error("[connectInstitution]", err);
    return { error: "No se pudo conectar la institución. Inténtalo de nuevo." };
  }
}

export async function disconnectInstitution(
  institution: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const accounts = await prisma.financialAccount.findMany({
      where: { userId, institution },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);
    if (accountIds.length === 0) return { error: "Institución no encontrada." };

    // Borrar primero las transacciones (FK) y luego las cuentas, en una
    // transacción atómica para no dejar el estado a medias.
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId, accountId: { in: accountIds } } }),
      prisma.financialAccount.deleteMany({ where: { userId, institution } }),
    ]);

    revalidateAll();
    return {};
  } catch (err) {
    console.error("[disconnectInstitution]", err);
    return { error: "No se pudo desconectar. Inténtalo de nuevo." };
  }
}
