/*
  GET /api/export/report

  Route Handler que genera el reporte mensual en PDF y lo devuelve
  como archivo descargable.

  ¿Cómo funciona @react-pdf/renderer en el servidor?
  - `renderToBuffer()` recibe un componente React de react-pdf
    y devuelve un Buffer con el PDF compilado.
  - Todo ocurre en Node.js — no toca el browser ni el DOM.
  - El resultado es un PDF estándar que cualquier visor puede abrir.

  Nota sobre el import dinámico de `renderToBuffer`:
  En Next.js con Turbopack, algunos módulos pesados se importan dinámicamente
  para evitar que bloqueen el arranque del servidor. react-pdf es uno de ellos.
*/

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getAccounts,
  getBudgets,
  getCards,
  getGoals,
  getMonthlyHistory,
  getTransactions,
} from "@/lib/data";
import { FinancialReport } from "@/lib/export/report";

export async function GET() {
  // Verificar sesión
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: renderizar el PDF (renderToBuffer) es costoso en CPU.
  const { ok, retryAfterMs } = rateLimit(`export-pdf:${session.user.id}`, 10, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Demasiadas exportaciones. Intenta de nuevo en un momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  // Cargar todos los datos en paralelo
  const [accounts, cards, transactions, goals, budgets, monthlyHistory] =
    await Promise.all([
      getAccounts(),
      getCards(),
      getTransactions(),
      getGoals(),
      getBudgets(),
      getMonthlyHistory(),
    ]);

  const now = new Date();
  const period = now.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const generatedAt = now.toISOString();

  // Import dinámico — react-pdf es solo Node.js, no debe llegar al bundle del cliente
  const { renderToBuffer } = await import("@react-pdf/renderer");

  const nodeBuffer = await renderToBuffer(
    FinancialReport({
      data: {
        generatedAt,
        period,
        accounts,
        cards,
        transactions,
        goals,
        budgets,
        monthlyHistory,
      },
    })
  );

  // NextResponse espera BodyInit (Uint8Array), no Buffer de Node.js
  const buffer = new Uint8Array(nodeBuffer);
  const filename = `financial-report-${now.toISOString().slice(0, 7)}.pdf`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
