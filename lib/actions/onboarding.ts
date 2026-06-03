"use server";

/*
  lib/actions/onboarding.ts — Server Actions del flujo de bienvenida.
  ──────────────────────────────────────────────────────────────────
  Dos acciones que el usuario nuevo dispara desde la pantalla de bienvenida:

    loadSampleData()  → puebla su espacio con el set de datos de ejemplo
                        para que pueda explorar la app de inmediato.
    clearAllData()    → borra TODO (sea ejemplo o real) y deja el espacio
                        en cero para empezar desde su propia importación.

  Ambas marcan/limpian el flag User.usingSampleData, que controla el banner
  "estás viendo datos de ejemplo".
*/

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { seedUserData, clearUserData } from "@/lib/sample-data";

// Rutas con datos derivados que deben refrescarse tras mutar la DB.
const DATA_PATHS = ["/dashboard", "/accounts", "/cards", "/transactions", "/budget", "/analytics", "/goals", "/investments"];

function revalidateAll() {
  for (const path of DATA_PATHS) revalidatePath(path);
}

export async function loadSampleData(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  const { ok } = rateLimit(`onboarding:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    await seedUserData(prisma, userId);
    await prisma.user.update({ where: { id: userId }, data: { usingSampleData: true } });
  } catch (err) {
    console.error("[loadSampleData]", err);
    return { error: "No se pudieron cargar los datos de ejemplo. Inténtalo de nuevo." };
  }

  revalidateAll();
  return {};
}

export async function clearAllData(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  const { ok } = rateLimit(`onboarding:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    await clearUserData(prisma, userId);
    await prisma.user.update({ where: { id: userId }, data: { usingSampleData: false } });
  } catch (err) {
    console.error("[clearAllData]", err);
    return { error: "No se pudieron borrar los datos. Inténtalo de nuevo." };
  }

  revalidateAll();
  return {};
}
