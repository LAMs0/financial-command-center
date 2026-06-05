"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeImportPayload } from "@/lib/import/validate";
import { notifyMonitoring } from "@/lib/logger";
import type { ImportPayload } from "@/lib/import/types";

export async function saveImportedStatement(rawPayload: ImportPayload): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };

  const userId = session.user.id;

  const { ok } = await rateLimit(`import-save:${userId}`, 20, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." };

  const payload = sanitizeImportPayload(rawPayload);

  try {
    await prisma.$transaction(async (tx) => {
      let accountId: string | null = null;

      if (payload.account.kind === "financial_account" || payload.account.kind === "goal") {
        const created = await tx.financialAccount.create({
          data: {
            userId,
            name: payload.account.name,
            institution: payload.account.institution,
            type: payload.account.accountType,
            balance: payload.account.balance,
            currency: payload.account.currency,
            color: pickColor(),
            lastUpdated: new Date(),
          },
        });
        accountId = created.id;
      } else if (payload.account.kind === "credit_card") {
        await tx.creditCard.create({
          data: {
            userId,
            name: payload.account.name,
            institution: payload.account.institution,
            lastFourDigits: payload.account.lastFourDigits ?? "0000",
            balance: payload.account.balance,
            limit: payload.account.limit ?? 0,
            currency: payload.account.currency,
            cutoffDay: payload.account.cutoffDay ?? 1,
            paymentDueDay: payload.account.paymentDueDay ?? 20,
            minimumPayment: 0,
            color: pickColor(),
          },
        });

        const refAccount = await tx.financialAccount.create({
          data: {
            userId,
            name: `${payload.account.name} - cuenta de referencia`,
            institution: payload.account.institution,
            type: "checking",
            balance: 0,
            currency: payload.account.currency,
            color: "#64748b",
            lastUpdated: new Date(),
          },
        });
        accountId = refAccount.id;
      }

      if (accountId && payload.transactions.length > 0) {
        const existingSet = new Set<string>();
        const existing = await tx.transaction.findMany({
          where: { userId },
          select: { date: true, description: true, amount: true },
        });

        for (const item of existing) {
          existingSet.add(`${item.date.toISOString().slice(0, 10)}|${item.description}|${item.amount}`);
        }

        const uniqueTransactions = payload.transactions.filter((transaction) => {
          const key = `${transaction.date}|${transaction.description}|${transaction.amount}`;
          return !existingSet.has(key);
        });

        if (uniqueTransactions.length > 0) {
          await tx.transaction.createMany({
            data: uniqueTransactions.map((transaction) => ({
              userId,
              accountId,
              description: transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category,
              date: new Date(transaction.date),
              currency: transaction.currency,
            })),
          });
        }
      }

      for (const goal of payload.goals) {
        await tx.goal.create({
          data: {
            userId,
            name: goal.name,
            category: goal.category,
            currentAmount: goal.currentAmount,
            targetAmount: goal.currentAmount * 2,
            currency: goal.currency,
            targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            color: "#10b981",
            icon: goal.icon,
          },
        });
      }
    });
  } catch (error) {
    await notifyMonitoring("import.save_failed", error, {
      accountKind: payload.account.kind,
      transactions: payload.transactions.length,
      userId,
    });
    return { error: "No se pudo guardar en la base de datos. Intentalo de nuevo." };
  }

  for (const path of ["/dashboard", "/accounts", "/cards", "/transactions", "/budget", "/analytics", "/goals"]) {
    revalidatePath(path);
  }

  if (payload.account.kind === "credit_card") redirect("/cards");
  if (payload.goals.length > 0) redirect("/goals");
  redirect("/accounts");
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#f43f5e", "#84cc16"];
let colorIndex = 0;

function pickColor() {
  return COLORS[colorIndex++ % COLORS.length];
}
