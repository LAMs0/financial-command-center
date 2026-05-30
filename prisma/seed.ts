/*
  seed.ts — Pobla la base de datos con los datos mock de Phase 1/2.

  ¿Por qué un seed script?
  Permite tener datos de prueba reales en la DB desde el primer día.
  Cuando conectes la app, el dashboard se verá EXACTAMENTE igual que con
  los mock data — porque este seed replica 1:1 los archivos de lib/mock-data/.

  Cómo correrlo:
    npx prisma db seed

  O después de una migración:
    npx prisma migrate dev  (corre el seed automáticamente si está configurado)

  Nota sobre Decimal:
  Los campos monetarios ahora son Decimal en el schema. Prisma acepta `number`
  de JS al crear registros y los convierte a Decimal sin pérdida para estos
  valores. Al LEER, Prisma devuelve objetos Prisma.Decimal — eso lo manejaremos
  en la capa de queries cuando conectemos la UI.
*/

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Financial Command Center...");

  // Crear usuario de prueba
  const user = await prisma.user.upsert({
    where: { email: "demo@financialcc.app" },
    update: {},
    create: {
      email: "demo@financialcc.app",
      name: "Demo User",
      image: null,
    },
  });

  console.log(`✅ User: ${user.email}`);

  // ── Cuentas bancarias (1:1 con lib/mock-data/accounts.ts) ───────────────────
  const accountData = [
    {
      name: "BBVA Débito",
      institution: "BBVA",
      type: "checking" as const,
      balance: 28450.75,
      currency: "MXN" as const,
      color: "#004481",
      lastUpdated: new Date("2025-05-27"),
    },
    {
      name: "Nu Ahorro",
      institution: "Nu",
      type: "savings" as const,
      balance: 52300.0,
      currency: "MXN" as const,
      color: "#820AD1",
      lastUpdated: new Date("2025-05-27"),
    },
    {
      name: "HSBC Nómina",
      institution: "HSBC",
      type: "checking" as const,
      balance: 12800.5,
      currency: "MXN" as const,
      color: "#DB0011",
      lastUpdated: new Date("2025-05-26"),
    },
    {
      name: "Efectivo",
      institution: "Personal",
      type: "cash" as const,
      balance: 3200.0,
      currency: "MXN" as const,
      color: "#16a34a",
      lastUpdated: new Date("2025-05-27"),
    },
  ];

  // Eliminar cuentas previas del usuario demo y recrear
  await prisma.financialAccount.deleteMany({ where: { userId: user.id } });
  const accounts = await Promise.all(
    accountData.map((a) =>
      prisma.financialAccount.create({ data: { ...a, userId: user.id } })
    )
  );
  console.log(`✅ Accounts: ${accounts.length} created`);

  // ── Tarjetas de crédito (1:1 con lib/mock-data/cards.ts) ────────────────────
  await prisma.creditCard.deleteMany({ where: { userId: user.id } });
  await prisma.creditCard.createMany({
    data: [
      {
        name: "Amex Gold",
        institution: "American Express",
        balance: 8650.0,
        limit: 40000.0,
        currency: "MXN",
        cutoffDay: 14,
        paymentDueDay: 9,
        lastFourDigits: "4821",
        minimumPayment: 519.0,
        color: "#B8860B",
        userId: user.id,
      },
      {
        name: "BBVA Azul",
        institution: "BBVA",
        balance: 3200.5,
        limit: 15000.0,
        currency: "MXN",
        cutoffDay: 20,
        paymentDueDay: 15,
        lastFourDigits: "3390",
        minimumPayment: 192.0,
        color: "#004481",
        userId: user.id,
      },
      {
        name: "Nu Card",
        institution: "Nu",
        balance: 1450.0,
        limit: 10000.0,
        currency: "MXN",
        cutoffDay: 5,
        paymentDueDay: 28,
        lastFourDigits: "7714",
        minimumPayment: 87.0,
        color: "#820AD1",
        userId: user.id,
      },
    ],
  });
  console.log("✅ Credit cards: 3 created");

  // ── Transacciones (1:1 con lib/mock-data/transactions.ts) ───────────────────
  // accounts[0] = BBVA Débito (acc-001), accounts[2] = HSBC Nómina (acc-003)
  const bbva = accounts[0];
  const hsbc = accounts[2];

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.createMany({
    data: [
      // txn-001
      { description: "Nómina Mayo", amount: 32000, type: "income", category: "salary", date: new Date("2025-05-15"), currency: "MXN", accountId: hsbc.id, userId: user.id },
      // txn-002
      { description: "Renta departamento", amount: 9500, type: "expense", category: "housing", date: new Date("2025-05-01"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-003
      { description: "Uber Eats", amount: 285, type: "expense", category: "food", date: new Date("2025-05-26"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-004
      { description: "Netflix", amount: 219, type: "expense", category: "entertainment", date: new Date("2025-05-18"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-005
      { description: "Gasolinera", amount: 800, type: "expense", category: "transport", date: new Date("2025-05-24"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-006
      { description: "Supermercado Walmart", amount: 1350, type: "expense", category: "food", date: new Date("2025-05-22"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-007
      { description: "Freelance diseño", amount: 5000, type: "income", category: "other", date: new Date("2025-05-20"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-008 — transferencia a Nu (faltaba en el seed anterior)
      { description: "Transferencia a Nu", amount: 10000, type: "transfer", category: "transfer", date: new Date("2025-05-16"), currency: "MXN", accountId: hsbc.id, userId: user.id },
      // txn-009
      { description: "Gimnasio", amount: 699, type: "expense", category: "health", date: new Date("2025-05-10"), currency: "MXN", accountId: bbva.id, userId: user.id },
      // txn-010
      { description: "Amazon — audífonos", amount: 1890, type: "expense", category: "shopping", date: new Date("2025-05-08"), currency: "MXN", accountId: bbva.id, userId: user.id },
    ],
  });
  console.log("✅ Transactions: 10 created");

  // ── Inversiones (1:1 con lib/mock-data/investments.ts) ──────────────────────
  await prisma.investment.deleteMany({ where: { userId: user.id } });
  await prisma.investment.createMany({
    data: [
      { name: "S&P 500 ETF", ticker: "VOO", type: "etf", quantity: 5, purchasePrice: 3800, currentPrice: 4250, currency: "MXN", institution: "GBM", userId: user.id },
      { name: "Apple Inc.", ticker: "AAPL", type: "stock", quantity: 10, purchasePrice: 2900, currentPrice: 3120, currency: "MXN", institution: "GBM", userId: user.id },
      { name: "Bitcoin", ticker: "BTC", type: "crypto", quantity: 0.05, purchasePrice: 900000, currentPrice: 1050000, currency: "MXN", institution: "Bitso", userId: user.id },
      { name: "CETES 28 días", type: "bond", quantity: 1, purchasePrice: 10000, currentPrice: 10112, currency: "MXN", institution: "cetesdirecto", userId: user.id },
    ],
  });
  console.log("✅ Investments: 4 created");

  // ── Metas financieras (1:1 con lib/mock-data/goals.ts) ──────────────────────
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.goal.createMany({
    data: [
      { name: "Fondo de emergencia", category: "emergency_fund", targetAmount: 100000, currentAmount: 52300, targetDate: new Date("2025-12-31"), currency: "MXN", color: "#10b981", icon: "🛡️", userId: user.id },
      { name: "Viaje a Japón", category: "vacation", targetAmount: 60000, currentAmount: 18500, targetDate: new Date("2026-03-01"), currency: "MXN", color: "#f59e0b", icon: "✈️", userId: user.id },
      { name: "MacBook Pro", category: "custom", targetAmount: 45000, currentAmount: 45000, targetDate: new Date("2025-05-01"), currency: "MXN", color: "#6366f1", icon: "💻", userId: user.id },
      { name: "Enganche depa", category: "home", targetAmount: 300000, currentAmount: 28450, targetDate: new Date("2027-06-01"), currency: "MXN", color: "#3b82f6", icon: "🏠", userId: user.id },
    ],
  });
  console.log("✅ Goals: 4 created");

  // ── Presupuestos / Mayo 2025 (1:1 con lib/mock-data/budgets.ts) ─────────────
  await prisma.budget.deleteMany({
    where: { userId: user.id, month: "2025-05" },
  });
  await prisma.budget.createMany({
    data: [
      { category: "housing", label: "Housing", allocated: 10000, spent: 9500, color: "#3b82f6", icon: "Home", month: "2025-05", userId: user.id },
      { category: "food", label: "Food", allocated: 3000, spent: 1635, color: "#10b981", icon: "Utensils", month: "2025-05", userId: user.id },
      { category: "transport", label: "Transport", allocated: 1500, spent: 800, color: "#14b8a6", icon: "Car", month: "2025-05", userId: user.id },
      { category: "entertainment", label: "Entertainment", allocated: 600, spent: 219, color: "#8b5cf6", icon: "Tv2", month: "2025-05", userId: user.id },
      { category: "health", label: "Health & Fitness", allocated: 700, spent: 699, color: "#f59e0b", icon: "Dumbbell", month: "2025-05", userId: user.id },
      { category: "shopping", label: "Shopping", allocated: 1500, spent: 1890, color: "#ef4444", icon: "ShoppingBag", month: "2025-05", userId: user.id },
      { category: "services", label: "Subscriptions", allocated: 500, spent: 0, color: "#6366f1", icon: "Zap", month: "2025-05", userId: user.id },
    ],
  });
  console.log("✅ Budgets (2025-05): 7 created");

  console.log("\n🎉 Seed complete! Demo user ready:");
  console.log(`   Email: ${user.email}`);
  console.log(`   ID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
