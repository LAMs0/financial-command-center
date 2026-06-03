"use server";

/*
  actions.ts — Server Actions del flujo de importación
  ──────────────────────────────────────────────────────
  Las Server Actions son funciones que corren en el servidor pero se pueden
  llamar desde Client Components (React llama a un endpoint de Next.js
  en segundo plano). Ideal para mutaciones de datos.

  ¿Por qué Server Action aquí y no Route Handler?
  - El guardado en DB es una mutación, no una consulta de archivo.
  - Las Server Actions son más simples: no necesitas fetch ni JSON.
  - React las integra con el sistema de formularios (useFormState).
*/

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeImportPayload } from "@/lib/import/validate";
import type { ImportPayload } from "@/lib/import/types";

export async function saveImportedStatement(rawPayload: ImportPayload): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const userId = session.user.id;

  // Rate limit: la escritura del extracto hace varias inserciones en la DB.
  const { ok } = rateLimit(`import-save:${userId}`, 20, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." };

  // NUNCA confiar en el payload del cliente: sanear y acotar antes de escribir.
  const payload = sanitizeImportPayload(rawPayload);

  try {
    await prisma.$transaction(async (tx) => {
      // ── 1. Crear FinancialAccount o CreditCard ─────────────────────────
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
        // Las transacciones de tarjeta de crédito se asocian a una cuenta corriente;
        // si no existe, creamos una cuenta de referencia.
        const refAccount = await tx.financialAccount.create({
          data: {
            userId,
            name: `${payload.account.name} — cuenta de referencia`,
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

      // ── 2. Crear transacciones (solo si hay cuenta de referencia) ───────
      if (accountId && payload.transactions.length > 0) {
        // Detectar duplicados: fecha + descripción + monto ya existentes en el userId
        const existingSet = new Set<string>();
        const existing = await tx.transaction.findMany({
          where: { userId },
          select: { date: true, description: true, amount: true },
        });
        for (const e of existing) {
          existingSet.add(`${e.date.toISOString().slice(0, 10)}|${e.description}|${e.amount}`);
        }

        const uniqueTxs = payload.transactions.filter((t) => {
          const key = `${t.date}|${t.description}|${t.amount}`;
          return !existingSet.has(key);
        });

        if (uniqueTxs.length > 0) {
          await tx.transaction.createMany({
            data: uniqueTxs.map((t) => ({
              userId,
              accountId,
              description: t.description,
              amount: t.amount,
              type: t.type,
              category: t.category,
              date: new Date(t.date),
              currency: t.currency,
            })),
          });
        }
      }

      // ── 3. Crear metas detectadas ────────────────────────────────────────
      for (const goal of payload.goals) {
        await tx.goal.create({
          data: {
            userId,
            name: goal.name,
            category: goal.category,
            currentAmount: goal.currentAmount,
            targetAmount: goal.currentAmount * 2, // Sugerencia: duplicar el saldo actual como meta
            currency: goal.currency,
            targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año desde hoy
            color: "#10b981",
            icon: goal.icon,
          },
        });
      }
    });
  } catch (err) {
    console.error("[saveImportedStatement]", err);
    return { error: "Error saving to database. Please try again." };
  }

  // Invalidar la caché de TODAS las páginas que muestran datos derivados,
  // para que el dashboard, net worth, cash flow, cuentas, tarjetas y
  // transacciones reflejen lo recién importado (no la versión en caché).
  for (const path of ["/dashboard", "/accounts", "/cards", "/transactions", "/budget", "/analytics", "/goals"]) {
    revalidatePath(path);
  }

  // Redirigir a la página correspondiente
  if (payload.account.kind === "credit_card") {
    redirect("/cards");
  }
  if (payload.goals.length > 0) {
    redirect("/goals");
  }
  redirect("/accounts");
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#f43f5e", "#84cc16"];
let _colorIdx = 0;
function pickColor() { return COLORS[_colorIdx++ % COLORS.length]; }
