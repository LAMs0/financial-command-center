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
import { calculateNetWorth } from "@/lib/calculations";
import { logger } from "@/lib/logger";

/** ¿Debemos leer de la base de datos real? */
function shouldUseDatabase(): boolean {
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
  if (!shouldUseDatabase()) return mock;
  try {
    return await loader();
  } catch (error) {
    logger.warn("data.query_failed", {
      label,
      error: error instanceof Error ? error.message : String(error),
    });
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
  El historial de net worth/cash flow se DERIVA (no hay tabla de snapshots).
  Con datos reales en la DB lo reconstruimos a partir de:
   - El net worth ACTUAL (cuentas + inversiones − tarjetas).
   - Las transacciones agrupadas por mes → ingresos/gastos por mes.
   - El net worth de meses anteriores se calcula "hacia atrás": el net worth
     del mes previo = net worth de este mes − (ingresos − gastos) de este mes.
  Así el dashboard refleja lo importado en vez de números mock fijos.
*/
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthLabel(ym: string): string {
  const mm = parseInt(ym.slice(5, 7), 10);
  return MONTH_LABELS[mm - 1] ?? ym;
}

export async function getMonthlyHistory(): Promise<MonthlySnapshot[]> {
  if (!shouldUseDatabase()) return mockMonthlyHistory;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return emptyMonthlyHistory();

    const [accounts, cards, investments, transactions] = await Promise.all([
      getAccounts(),
      getCards(),
      getInvestments(),
      getTransactions(),
    ]);

    // Sin datos reales todavía → devolver un histórico VACÍO (ceros), nunca
    // los datos mock. Un usuario real recién registrado debe ver su patrimonio
    // real ($0), no un gráfico de demostración con cifras inventadas.
    if (accounts.length === 0 && cards.length === 0 && transactions.length === 0) {
      return emptyMonthlyHistory();
    }

    const nw = calculateNetWorth(accounts, cards, investments);
    const currency = (accounts[0]?.currency ?? cards[0]?.currency ?? "USD") as Currency;

    // Agrupar ingresos/gastos por mes (YYYY-MM). Las transferencias no cuentan.
    const byMonth = new Map<string, { income: number; expenses: number }>();
    for (const t of transactions) {
      const ym = t.date.slice(0, 7);
      const g = byMonth.get(ym) ?? { income: 0, expenses: 0 };
      if (t.type === "income") g.income += t.amount;
      else if (t.type === "expense") g.expenses += t.amount;
      byMonth.set(ym, g);
    }

    // Rango de meses: desde la transacción más antigua hasta el mes actual.
    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = [...new Set([...byMonth.keys(), currentMonth])].sort().slice(-12);

    const snapshots: MonthlySnapshot[] = months.map((ym) => {
      const g = byMonth.get(ym) ?? { income: 0, expenses: 0 };
      return {
        month: ym,
        label: monthLabel(ym),
        income: g.income,
        expenses: g.expenses,
        assets: nw.totalAssets,
        liabilities: nw.totalLiabilities,
        netWorth: 0,
        currency,
      };
    });

    // Net worth hacia atrás desde el valor actual.
    let running = nw.netWorth;
    for (let i = snapshots.length - 1; i >= 0; i--) {
      snapshots[i].netWorth = Math.round(running);
      running -= snapshots[i].income - snapshots[i].expenses;
    }

    return snapshots;
  } catch (error) {
    logger.warn("data.monthly_history_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return emptyMonthlyHistory();
  }
}

/*
  Histórico vacío honesto: los últimos 6 meses con ceros.
  Se usa para usuarios sin datos (recién registrados) — así el layout y los
  gráficos renderizan sin romperse y SIN mostrar cifras de demostración.
*/
function emptyMonthlyHistory(): MonthlySnapshot[] {
  const now = new Date();
  const snapshots: MonthlySnapshot[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    snapshots.push({
      month: ym,
      label: monthLabel(ym),
      income: 0,
      expenses: 0,
      assets: 0,
      liabilities: 0,
      netWorth: 0,
    });
  }
  return snapshots;
}

/*
  Estado de onboarding del usuario actual.
   - hasData: ¿tiene CUALQUIER dato financiero? (cuentas, tarjetas, txs, etc.)
   - usingSampleData: ¿cargó el set de ejemplo desde la bienvenida?
  El dashboard lo usa para decidir si muestra la pantalla de bienvenida
  o el banner de "datos de ejemplo".
*/
export async function getOnboardingState(): Promise<{ hasData: boolean; usingSampleData: boolean }> {
  if (!shouldUseDatabase()) return { hasData: true, usingSampleData: false };
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { hasData: true, usingSampleData: false };

    const [accounts, cards, transactions, investments, goals, user] = await Promise.all([
      prisma.financialAccount.count({ where: { userId } }),
      prisma.creditCard.count({ where: { userId } }),
      prisma.transaction.count({ where: { userId } }),
      prisma.investment.count({ where: { userId } }),
      prisma.goal.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { usingSampleData: true } }),
    ]);

    const hasData = accounts + cards + transactions + investments + goals > 0;
    return { hasData, usingSampleData: user?.usingSampleData ?? false };
  } catch (error) {
    logger.warn("data.onboarding_state_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Ante un fallo, asumimos que tiene datos para no bloquear con la bienvenida.
    return { hasData: true, usingSampleData: false };
  }
}
