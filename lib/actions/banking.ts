"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getBankProvider } from "@/lib/banking";
import { notifyMonitoring } from "@/lib/logger";

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

  const { ok } = await rateLimit(`banking:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    const provider = getBankProvider();
    const { institution, accounts, transactions } = await provider.sync(institutionId);

    const existing = await prisma.financialAccount.count({
      where: { userId, institution: institution.name },
    });
    if (existing > 0) {
      return { error: `${institution.name} ya esta conectado.` };
    }

    const idByExternal = new Map<string, string>();
    for (const account of accounts) {
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
  } catch (error) {
    await notifyMonitoring("banking.connect_failed", error, { institutionId, userId });
    return { error: "No se pudo conectar la institucion. Intentalo de nuevo." };
  }
}

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
    ]);

    revalidateAll();
    return {};
  } catch (error) {
    await notifyMonitoring("banking.disconnect_failed", error, { institution, userId });
    return { error: "No se pudo desconectar. Intentalo de nuevo." };
  }
}
