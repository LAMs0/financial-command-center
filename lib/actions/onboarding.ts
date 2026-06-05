"use server";

/*
  Server actions del flujo de bienvenida.

  loadSampleData() puebla el espacio con datos demo.
  clearAllData() borra datos financieros del usuario, pero conserva su cuenta.
*/

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { seedUserData, clearUserData } from "@/lib/sample-data";
import { notifyMonitoring } from "@/lib/logger";

const DATA_PATHS = [
  "/dashboard",
  "/accounts",
  "/cards",
  "/transactions",
  "/budget",
  "/analytics",
  "/goals",
  "/investments",
];

function revalidateAll() {
  for (const path of DATA_PATHS) revalidatePath(path);
}

export async function loadSampleData(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`onboarding:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    await seedUserData(prisma, userId);
    await prisma.user.update({ where: { id: userId }, data: { usingSampleData: true } });
  } catch (error) {
    await notifyMonitoring("onboarding.load_sample_failed", error, { userId });
    return { error: "No se pudieron cargar los datos de ejemplo. Intentalo de nuevo." };
  }

  revalidateAll();
  return {};
}

export async function clearAllData(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  const { ok } = await rateLimit(`onboarding:${userId}`, 10, 60_000);
  if (!ok) return { error: "Demasiadas solicitudes. Espera un momento." };

  try {
    await clearUserData(prisma, userId);
    await prisma.user.update({ where: { id: userId }, data: { usingSampleData: false } });
  } catch (error) {
    await notifyMonitoring("onboarding.clear_data_failed", error, { userId });
    return { error: "No se pudieron borrar los datos. Intentalo de nuevo." };
  }

  revalidateAll();
  return {};
}
