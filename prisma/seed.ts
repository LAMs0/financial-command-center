/*
  seed.ts — Pobla la base de datos con los datos de ejemplo.

  ¿Por qué un seed script?
  Permite tener datos de prueba reales en la DB desde el primer día.
  El dataset ahora vive en `lib/sample-data.ts` (fuente única de verdad,
  compartida con el flujo de onboarding "Probar con datos de ejemplo").

  Cómo correrlo:
    npx prisma db seed
*/

import { PrismaClient } from "@prisma/client";
import { seedUserData } from "../lib/sample-data";

const prisma = new PrismaClient();

/** Usuario de desarrollo que crea este seed. Solo se usa aqui. */
const DEMO_USER_EMAIL = "demo@financialcc.app";

async function main() {
  console.log("🌱 Seeding Financial Command Center...");

  // Crear usuario de prueba
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL, name: "Demo User", image: null },
  });
  console.log(`✅ User: ${user.email}`);

  // Poblar con el dataset compartido. Usamos el mes "2025-05" para que el
  // usuario demo conserve el histórico original 1:1 con lib/mock-data.
  const counts = await seedUserData(prisma, user.id, { budgetMonth: "2025-05" });

  console.log(`✅ Accounts: ${counts.accounts}`);
  console.log(`✅ Credit cards: ${counts.cards}`);
  console.log(`✅ Transactions: ${counts.transactions}`);
  console.log(`✅ Investments: ${counts.investments}`);
  console.log(`✅ Goals: ${counts.goals}`);
  console.log(`✅ Budgets: ${counts.budgets}`);

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
