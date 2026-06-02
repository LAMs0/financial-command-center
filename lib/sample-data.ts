/*
  lib/sample-data.ts — Conjunto de datos de ejemplo + utilidades de poblado/borrado.
  ──────────────────────────────────────────────────────────────────────────────
  Una sola fuente de verdad para los datos demo. Lo usan DOS lugares:

    1. prisma/seed.ts        → poblar el usuario demo en desarrollo
    2. onboarding actions    → cuando un usuario NUEVO elige "Probar con datos
                               de ejemplo" en la pantalla de bienvenida

  ¿Por qué extraerlo aquí? Antes los datos vivían inline en seed.ts. Al moverlos
  a una función reutilizable evitamos duplicar el dataset y garantizamos que lo
  que ve el usuario al "probar" sea idéntico a lo que el equipo usa para demos.
*/

import type { PrismaClient } from "@prisma/client";

/** Mes actual en formato "YYYY-MM" — para que los presupuestos de ejemplo
 *  caigan en el mes que la app muestra por defecto. */
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

type SeedOptions = {
  /** Mes (YYYY-MM) al que se asignan los presupuestos de ejemplo.
   *  Default: mes actual (para que se vean al instante en /budget). */
  budgetMonth?: string;
};

/*
  Puebla TODOS los datos financieros de ejemplo para un usuario.
  Es idempotente: borra primero lo que el usuario tuviera y vuelve a crear,
  así "cargar ejemplo" dos veces no duplica filas.

  Acepta un PrismaClient (el singleton de la app o el del script de seed).
*/
export async function seedUserData(
  prisma: PrismaClient,
  userId: string,
  options: SeedOptions = {}
): Promise<{ accounts: number; cards: number; transactions: number; investments: number; goals: number; budgets: number }> {
  const budgetMonth = options.budgetMonth ?? currentMonth();

  // Limpiar cualquier dato previo del usuario (orden seguro: hijos antes que padres).
  await clearUserData(prisma, userId);

  // ── Cuentas bancarias ──────────────────────────────────────────────────────
  const accountData = [
    { name: "BBVA Débito", institution: "BBVA", type: "checking" as const, balance: 28450.75, currency: "MXN" as const, color: "#004481", lastUpdated: new Date("2025-05-27") },
    { name: "Nu Ahorro", institution: "Nu", type: "savings" as const, balance: 52300.0, currency: "MXN" as const, color: "#820AD1", lastUpdated: new Date("2025-05-27") },
    { name: "HSBC Nómina", institution: "HSBC", type: "checking" as const, balance: 12800.5, currency: "MXN" as const, color: "#DB0011", lastUpdated: new Date("2025-05-26") },
    { name: "Efectivo", institution: "Personal", type: "cash" as const, balance: 3200.0, currency: "MXN" as const, color: "#16a34a", lastUpdated: new Date("2025-05-27") },
  ];
  const accounts = await Promise.all(
    accountData.map((a) => prisma.financialAccount.create({ data: { ...a, userId } }))
  );

  // ── Tarjetas de crédito ──────────────────────────────────────────────────────
  await prisma.creditCard.createMany({
    data: [
      { name: "Amex Gold", institution: "American Express", balance: 8650.0, limit: 40000.0, currency: "MXN", cutoffDay: 14, paymentDueDay: 9, lastFourDigits: "4821", minimumPayment: 519.0, color: "#B8860B", userId },
      { name: "BBVA Azul", institution: "BBVA", balance: 3200.5, limit: 15000.0, currency: "MXN", cutoffDay: 20, paymentDueDay: 15, lastFourDigits: "3390", minimumPayment: 192.0, color: "#004481", userId },
      { name: "Nu Card", institution: "Nu", balance: 1450.0, limit: 10000.0, currency: "MXN", cutoffDay: 5, paymentDueDay: 28, lastFourDigits: "7714", minimumPayment: 87.0, color: "#820AD1", userId },
    ],
  });

  // ── Transacciones ──────────────────────────────────────────────────────────
  const bbva = accounts[0];
  const hsbc = accounts[2];
  await prisma.transaction.createMany({
    data: [
      { description: "Nómina Mayo", amount: 32000, type: "income", category: "salary", date: new Date("2025-05-15"), currency: "MXN", accountId: hsbc.id, userId },
      { description: "Renta departamento", amount: 9500, type: "expense", category: "housing", date: new Date("2025-05-01"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Uber Eats", amount: 285, type: "expense", category: "food", date: new Date("2025-05-26"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Netflix", amount: 219, type: "expense", category: "entertainment", date: new Date("2025-05-18"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Gasolinera", amount: 800, type: "expense", category: "transport", date: new Date("2025-05-24"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Supermercado Walmart", amount: 1350, type: "expense", category: "food", date: new Date("2025-05-22"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Freelance diseño", amount: 5000, type: "income", category: "other", date: new Date("2025-05-20"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Transferencia a Nu", amount: 10000, type: "transfer", category: "transfer", date: new Date("2025-05-16"), currency: "MXN", accountId: hsbc.id, userId },
      { description: "Gimnasio", amount: 699, type: "expense", category: "health", date: new Date("2025-05-10"), currency: "MXN", accountId: bbva.id, userId },
      { description: "Amazon — audífonos", amount: 1890, type: "expense", category: "shopping", date: new Date("2025-05-08"), currency: "MXN", accountId: bbva.id, userId },
    ],
  });

  // ── Inversiones ──────────────────────────────────────────────────────────────
  await prisma.investment.createMany({
    data: [
      { name: "S&P 500 ETF", ticker: "VOO", type: "etf", quantity: 5, purchasePrice: 3800, currentPrice: 4250, currency: "MXN", institution: "GBM", userId },
      { name: "Apple Inc.", ticker: "AAPL", type: "stock", quantity: 10, purchasePrice: 2900, currentPrice: 3120, currency: "MXN", institution: "GBM", userId },
      { name: "Bitcoin", ticker: "BTC", type: "crypto", quantity: 0.05, purchasePrice: 900000, currentPrice: 1050000, currency: "MXN", institution: "Bitso", userId },
      { name: "CETES 28 días", type: "bond", quantity: 1, purchasePrice: 10000, currentPrice: 10112, currency: "MXN", institution: "cetesdirecto", userId },
    ],
  });

  // ── Metas financieras ──────────────────────────────────────────────────────
  await prisma.goal.createMany({
    data: [
      { name: "Fondo de emergencia", category: "emergency_fund", targetAmount: 100000, currentAmount: 52300, targetDate: new Date("2025-12-31"), currency: "MXN", color: "#10b981", icon: "🛡️", userId },
      { name: "Viaje a Japón", category: "vacation", targetAmount: 60000, currentAmount: 18500, targetDate: new Date("2026-03-01"), currency: "MXN", color: "#f59e0b", icon: "✈️", userId },
      { name: "MacBook Pro", category: "custom", targetAmount: 45000, currentAmount: 45000, targetDate: new Date("2025-05-01"), currency: "MXN", color: "#6366f1", icon: "💻", userId },
      { name: "Enganche depa", category: "home", targetAmount: 300000, currentAmount: 28450, targetDate: new Date("2027-06-01"), currency: "MXN", color: "#3b82f6", icon: "🏠", userId },
    ],
  });

  // ── Presupuestos (mes configurable; default = mes actual) ────────────────────
  await prisma.budget.createMany({
    data: [
      { category: "housing", label: "Housing", allocated: 10000, spent: 9500, color: "#3b82f6", icon: "Home", month: budgetMonth, userId },
      { category: "food", label: "Food", allocated: 3000, spent: 1635, color: "#10b981", icon: "Utensils", month: budgetMonth, userId },
      { category: "transport", label: "Transport", allocated: 1500, spent: 800, color: "#14b8a6", icon: "Car", month: budgetMonth, userId },
      { category: "entertainment", label: "Entertainment", allocated: 600, spent: 219, color: "#8b5cf6", icon: "Tv2", month: budgetMonth, userId },
      { category: "health", label: "Health & Fitness", allocated: 700, spent: 699, color: "#f59e0b", icon: "Dumbbell", month: budgetMonth, userId },
      { category: "shopping", label: "Shopping", allocated: 1500, spent: 1890, color: "#ef4444", icon: "ShoppingBag", month: budgetMonth, userId },
      { category: "services", label: "Subscriptions", allocated: 500, spent: 0, color: "#6366f1", icon: "Zap", month: budgetMonth, userId },
    ],
  });

  return { accounts: 4, cards: 3, transactions: 10, investments: 4, goals: 4, budgets: 7 };
}

/*
  Borra TODOS los datos financieros de un usuario.
  Orden: primero las transacciones (FK a FinancialAccount), luego el resto.
  (El schema ya tiene onDelete: Cascade, pero ser explícitos evita sorpresas.)
*/
export async function clearUserData(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.investment.deleteMany({ where: { userId } });
  await prisma.creditCard.deleteMany({ where: { userId } });
  await prisma.financialAccount.deleteMany({ where: { userId } });
}
