import type { Account, Budget, CreditCard, Goal, Transaction } from "@/types/finance";

/*
  csv.ts — Serialización a CSV de los modelos de dominio
  ────────────────────────────────────────────────────────
  Funciones puras: reciben datos del dominio y devuelven una cadena CSV.
  El Route Handler se encarga de convertirla en Response con los headers
  correctos (Content-Type, Content-Disposition).

  Convención CSV:
  - Primera fila = encabezados
  - Valores con comas o comillas envueltos en ""
  - Fechas en formato ISO YYYY-MM-DD
  - Montos como números (sin símbolo de moneda) — Excel/Sheets los reconoce
*/

/** Escapa un valor para CSV: envuelve en comillas si contiene comas/comillas/saltos */
function cell(value: string | number | undefined | null): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...values: (string | number | undefined | null)[]): string {
  return values.map(cell).join(",");
}

// ── Transacciones ──────────────────────────────────────────────────────────

export function transactionsToCSV(
  transactions: Transaction[],
  accountNameById: Record<string, string>
): string {
  const header = row("Date", "Description", "Amount", "Type", "Category", "Account", "Currency", "Notes");

  const rows = transactions.map((t) =>
    row(
      t.date,
      t.description,
      t.amount,
      t.type,
      t.category,
      accountNameById[t.accountId] ?? t.accountId,
      t.currency,
      t.notes ?? ""
    )
  );

  return [header, ...rows].join("\r\n");
}

// ── Cuentas ────────────────────────────────────────────────────────────────

export function accountsToCSV(accounts: Account[]): string {
  const header = row("Name", "Institution", "Type", "Balance", "Currency", "Last Updated");

  const rows = accounts.map((a) =>
    row(a.name, a.institution, a.type, a.balance, a.currency, a.lastUpdated)
  );

  return [header, ...rows].join("\r\n");
}

// ── Tarjetas ───────────────────────────────────────────────────────────────

export function cardsToCSV(cards: CreditCard[]): string {
  const header = row(
    "Name", "Institution", "Last 4 Digits",
    "Balance", "Limit", "Utilization %",
    "Currency", "Cutoff Day", "Payment Due Day", "Minimum Payment"
  );

  const rows = cards.map((c) => {
    const util = c.limit > 0 ? ((c.balance / c.limit) * 100).toFixed(1) : "0.0";
    return row(
      c.name, c.institution, c.lastFourDigits,
      c.balance, c.limit, util,
      c.currency, c.cutoffDay, c.paymentDueDay, c.minimumPayment
    );
  });

  return [header, ...rows].join("\r\n");
}

// ── Metas ──────────────────────────────────────────────────────────────────

export function goalsToCSV(goals: Goal[]): string {
  const header = row(
    "Name", "Category", "Target Amount", "Current Amount",
    "Progress %", "Currency", "Target Date"
  );

  const rows = goals.map((g) => {
    const progress = g.targetAmount > 0
      ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1)
      : "0.0";
    return row(
      g.name, g.category, g.targetAmount, g.currentAmount,
      progress, g.currency, g.targetDate
    );
  });

  return [header, ...rows].join("\r\n");
}

// ── Presupuestos ───────────────────────────────────────────────────────────

export function budgetsToCSV(budgets: Budget[]): string {
  const header = row(
    "Category", "Label", "Allocated", "Spent",
    "Remaining", "Usage %", "Currency"
  );

  const rows = budgets.map((b) => {
    const remaining = b.allocated - b.spent;
    const usage = b.allocated > 0 ? ((b.spent / b.allocated) * 100).toFixed(1) : "0.0";
    return row(
      b.category, b.label, b.allocated, b.spent,
      remaining, usage, b.currency
    );
  });

  return [header, ...rows].join("\r\n");
}
