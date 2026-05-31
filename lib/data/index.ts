/*
  lib/data — Capa de acceso a datos (Data Access Layer / "repository").
  ────────────────────────────────────────────────────────────────────
  El resto de la app NO importa mocks ni Prisma directamente. Importa
  estas funciones:

    import { getAccounts, getTransactions } from "@/lib/data";

  ¿Por qué este patrón?
  1. Desacopla la UI de la fuente de datos. Hoy puede venir de mocks,
     mañana de Prisma, pasado de una API externa — los componentes no cambian.
  2. Un solo lugar traduce Prisma.Decimal/Date → number/string (ver serialize.ts).
  3. Fallback seguro: si la DB no está configurada o falla, devolvemos los
     mocks en vez de romper la pantalla. Ideal mientras montas Neon.

  ── El switch ──
  Controlado por la variable de entorno DATA_SOURCE:
    DATA_SOURCE=database  → lee de Prisma/PostgreSQL
    DATA_SOURCE=mock (o vacío) → usa lib/mock-data  (DEFAULT)

  Todas las funciones son async porque una query real a la DB es async.
  Los Server Components simplemente hacen `await getAccounts()`.
*/

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { toISODate, toNumber } from "./serialize";
import {
  mockAccounts,
  mockCards,
  mockTransactions,
  mockInvestments,
  mockGoals,
  mockMonthlyHistory,
  mockBudgets,
  type MonthlySnapshot,
  type Budget,
} from "@/lib/mock-data";
import type {
  Account,
  AppNotification,
  CreditCard,
  Transaction,
  Investment,
  Goal,
  AccountType,
  Currency,
  TransactionType,
  TransactionCategory,
  InvestmentType,
  GoalCategory,
} from "@/types/finance";
import { generateNotifications } from "@/lib/notifications";

/** ¿Debemos leer de la base de datos real? */
function useDatabase(): boolean {
  return process.env.DATA_SOURCE === "database";
}

/*
  Lee el id del usuario de la sesión activa (Auth.js v5).
  cache() deduplica la llamada dentro de un mismo render pass — si 6 funciones
  lo llaman en paralelo, auth() solo se ejecuta una vez por request.
*/
const getCurrentUserId = cache(async (): Promise<string | null> => {
  const session = await auth();
  return session?.user?.id ?? null;
});

/*
  Wrapper que centraliza el patrón "intenta DB, si no usa mock".
  Si DATA_SOURCE no es "database", devuelve el mock sin tocar Prisma.
  Si la query falla (DB caída, cliente sin generar, etc.) avisa y cae al mock.
*/
async function withFallback<T>(
  label: string,
  loader: () => Promise<T>,
  mock: T
): Promise<T> {
  if (!useDatabase()) return mock;
  try {
    return await loader();
  } catch (error) {
    console.warn(
      `[lib/data] Falló la query "${label}", usando datos mock como fallback.`,
      error
    );
    return mock;
  }
}

// ── Cuentas ──────────────────────────────────────────────────────────────────
export async function getAccounts(): Promise<Account[]> {
  return withFallback(
    "getAccounts",
    async () => {
      const userId = await getCurrentUserId();
      if (!userId) return mockAccounts;
      const rows = await prisma.financialAccount.findMany({
        where: { userId },
        orderBy: { balance: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        institution: r.institution,
        type: r.type as AccountType,
        balance: toNumber(r.balance),
        currency: r.currency as Currency,
        lastUpdated: toISODate(r.lastUpdated),
        color: r.color,
      }));
    },
    mockAccounts
  );
}

// ── Tarjetas de crédito ────────────────────────────────────────────────────
export async function getCards(): Promise<CreditCard[]> {
  return withFallback(
    "getCards",
    async () => {
      const userId = await getCurrentUserId();
      if (!userId) return mockCards;
      const rows = await prisma.creditCard.findMany({ where: { userId } });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        institution: r.institution,
        lastFourDigits: r.lastFourDigits,
        balance: toNumber(r.balance),
        limit: toNumber(r.limit),
        currency: r.currency as Currency,
        cutoffDay: r.cutoffDay,
        paymentDueDay: r.paymentDueDay,
        minimumPayment: toNumber(r.minimumPayment),
        color: r.color,
      }));
    },
    mockCards
  );
}

// ── Transacciones ────────────────────────────────────────────────────────────
export async function getTransactions(): Promise<Transaction[]> {
  return withFallback(
    "getTransactions",
    async () => {
      const userId = await getCurrentUserId();
      if (!userId) return mockTransactions;
      const rows = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        description: r.description,
        amount: toNumber(r.amount),
        type: r.type as TransactionType,
        category: r.category as TransactionCategory,
        date: toISODate(r.date),
        accountId: r.accountId,
        currency: r.currency as Currency,
        notes: r.notes ?? undefined,
      }));
    },
    mockTransactions
  );
}

// ── Inversiones ──────────────────────────────────────────────────────────────
export async function getInvestments(): Promise<Investment[]> {
  return withFallback(
    "getInvestments",
    async () => {
      const userId = await getCurrentUserId();
      if (!userId) return mockInvestments;
      const rows = await prisma.investment.findMany({ where: { userId } });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        ticker: r.ticker ?? undefined,
        type: r.type as InvestmentType,
        quantity: toNumber(r.quantity),
        purchasePrice: toNumber(r.purchasePrice),
        currentPrice: toNumber(r.currentPrice),
        currency: r.currency as Currency,
        institution: r.institution,
      }));
    },
    mockInvestments
  );
}

// ── Metas ──────────────────────────────────────────────────────────────────
export async function getGoals(): Promise<Goal[]> {
  return withFallback(
    "getGoals",
    async () => {
      const userId = await getCurrentUserId();
      if (!userId) return mockGoals;
      const rows = await prisma.goal.findMany({ where: { userId } });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category as GoalCategory,
        targetAmount: toNumber(r.targetAmount),
        currentAmount: toNumber(r.currentAmount),
        currency: r.currency as Currency,
        targetDate: toISODate(r.targetDate),
        color: r.color,
        icon: r.icon ?? "🎯",
      }));
    },
    mockGoals
  );
}

// ── Presupuestos ─────────────────────────────────────────────────────────────
export async function getBudgets(
  month = new Date().toISOString().slice(0, 7)
): Promise<Budget[]> {
  return withFallback(
    "getBudgets",
    async () => {
      const userId = await getCurrentUserId();
      if (!userId) return mockBudgets;
      const rows = await prisma.budget.findMany({
        where: { userId, month },
      });
      return rows.map((r) => ({
        id: r.id,
        category: r.category,
        label: r.label,
        allocated: toNumber(r.allocated),
        spent: toNumber(r.spent),
        currency: r.currency as Budget["currency"],
        color: r.color,
        icon: r.icon,
      }));
    },
    mockBudgets
  );
}

// ── Notificaciones ───────────────────────────────────────────────────────────
/*
  Las notificaciones son derivadas — no tienen tabla propia en la DB.
  Se generan on-the-fly desde los datos actuales del usuario.
  Usamos Promise.all para las 3 fuentes de datos en paralelo.
*/
export async function getNotifications(): Promise<AppNotification[]> {
  const [accounts, cards, goals, budgets] = await Promise.all([
    getAccounts(),
    getCards(),
    getGoals(),
    getBudgets(),
  ]);
  return generateNotifications({ accounts, cards, goals, budgets });
}

// ── Historial mensual ────────────────────────────────────────────────────────
/*
  El historial de net worth/cash flow se deriva (no hay tabla propia todavía).
  De momento siempre devuelve el mock; cuando tengamos snapshots reales en DB
  esta función será el único punto a cambiar.
*/
export async function getMonthlyHistory(): Promise<MonthlySnapshot[]> {
  return mockMonthlyHistory;
}
