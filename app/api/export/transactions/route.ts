/*
  GET /api/export/transactions?format=csv&dataset=transactions|accounts|cards|goals|budgets

  Route Handler que devuelve datos financieros como archivo CSV descargable.

  ¿Por qué un Route Handler y no una Server Action?
  - Las Server Actions devuelven datos a React; no pueden devolver archivos binarios.
  - Los Route Handlers son HTTP puros: controlan headers, tipo de contenido y body.
  - El navegador los puede "navegar" directamente — el header Content-Disposition
    le dice que descargue el archivo en lugar de mostrarlo.

  Seguridad: el usuario debe estar autenticado (la sesión se verifica via auth()).
  Si no hay sesión, devolvemos 401.
*/

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getAccounts, getBudgets, getCards, getGoals, getTransactions } from "@/lib/data";

// Consulta Prisma (Node), no Edge.
export const runtime = "nodejs";
import {
  accountsToCSV,
  budgetsToCSV,
  cardsToCSV,
  goalsToCSV,
  transactionsToCSV,
} from "@/lib/export/csv";

type Dataset = "transactions" | "accounts" | "cards" | "goals" | "budgets";

export async function GET(req: NextRequest) {
  // Verificar sesión
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ok, retryAfterMs } = await rateLimit(`export-csv:${session.user.id}`, 30, 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: "Demasiadas exportaciones. Intenta de nuevo en un momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const dataset = (req.nextUrl.searchParams.get("dataset") ?? "transactions") as Dataset;

  let csv: string;
  let filename: string;

  const today = new Date().toISOString().slice(0, 10);

  switch (dataset) {
    case "accounts": {
      const accounts = await getAccounts();
      csv = accountsToCSV(accounts);
      filename = `accounts-${today}.csv`;
      break;
    }
    case "cards": {
      const cards = await getCards();
      csv = cardsToCSV(cards);
      filename = `credit-cards-${today}.csv`;
      break;
    }
    case "goals": {
      const goals = await getGoals();
      csv = goalsToCSV(goals);
      filename = `goals-${today}.csv`;
      break;
    }
    case "budgets": {
      const budgets = await getBudgets();
      csv = budgetsToCSV(budgets);
      filename = `budget-${today}.csv`;
      break;
    }
    default: {
      const [transactions, accounts] = await Promise.all([getTransactions(), getAccounts()]);
      const accountNameById = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
      csv = transactionsToCSV(transactions, accountNameById);
      filename = `transactions-${today}.csv`;
    }
  }

  // BOM UTF-8: hace que Excel reconozca caracteres especiales (tildes, ñ)
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
