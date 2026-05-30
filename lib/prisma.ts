/*
  lib/prisma.ts — Cliente Prisma singleton.

  ¿Por qué singleton?
  En desarrollo, Next.js hace Hot Module Replacement (HMR) constantemente.
  Sin este patrón, cada recarga crearía una nueva conexión a la DB hasta
  agotar el pool de conexiones de Neon (máximo ~10 en free tier).

  El truco: guardamos la instancia en `globalThis` que persiste entre
  reloads de HMR, pero en producción siempre creamos una instancia fresca.

  Uso:
    import { prisma } from "@/lib/prisma"
    const accounts = await prisma.financialAccount.findMany(...)
*/

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
