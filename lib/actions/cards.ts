"use server";

/*
  lib/actions/cards.ts — Acciones de tarjetas de crédito.
  ────────────────────────────────────────────────────────
  Por ahora solo `deleteCard`: borra una tarjeta del panel del usuario. Es una
  acción destructiva, por eso la UI (DeleteCardButton) exige confirmación.

  Nota: esto borra el registro local (`CreditCard`); NO desvincula nada de un
  banco externo — las tarjetas no provienen del sync de Plaid (ese flujo solo
  crea FinancialAccount + Transaction).
*/

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyMonitoring } from "@/lib/logger";

export async function deleteCard(cardId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autenticado" };
  const userId = session.user.id;

  try {
    // deleteMany con userId en el where: garantiza que un usuario solo pueda
    // borrar SUS tarjetas (defensa contra IDs ajenos). count=0 → no era suya.
    const result = await prisma.creditCard.deleteMany({ where: { id: cardId, userId } });
    if (result.count === 0) return { error: "Tarjeta no encontrada." };

    revalidatePath("/cards");
    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    await notifyMonitoring("cards.delete_failed", error, { cardId, userId });
    return { error: "No se pudo eliminar la tarjeta. Intentalo de nuevo." };
  }
}
