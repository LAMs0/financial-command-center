/*
  lib/import/validate.ts — Saneamiento del payload de importación.
  ──────────────────────────────────────────────────────────────────
  `saveImportedStatement` recibe un ImportPayload que VIENE DEL CLIENTE
  (la UI de revisión deja editar montos, descripciones, etc.). Aunque todo
  queda aislado por userId, un cliente malicioso o con bugs podría enviar:
    - miles de transacciones        -> bloat/DoS de la DB
    - strings de megabytes          -> bloat / payloads enormes
    - montos NaN/Infinity/negativos -> datos corruptos
    - enums invalidos               -> Prisma lanza y rompe todo el import

  Por eso NUNCA confiamos en la forma del payload: lo tratamos como `unknown`
  y lo coercionamos a valores validos y acotados antes de tocar Prisma.
*/

import type { ImportPayload, ParsedTransaction, DetectedAccount, DetectedGoal } from "./types";
import type { Currency, TransactionType, AccountType } from "@/types/finance";

// Cotas
export const MAX_TRANSACTIONS = 5_000;   // un extracto real rara vez supera unos miles
export const MAX_GOALS = 100;
const MAX_STR = 200;
const MAX_NAME = 120;
const MAX_CATEGORY = 40;
const MAX_MONEY = 1_000_000_000_000;       // 1e12 - techo defensivo
const MIN_MONEY = 0;

// Whitelists de enums
const TX_TYPES: readonly TransactionType[] = ["income", "expense", "transfer"];
const CURRENCIES: readonly Currency[] = ["MXN", "USD", "EUR"];
const ACCOUNT_TYPES: readonly AccountType[] = ["checking", "savings", "cash", "investment"];
const ACCOUNT_KINDS = ["financial_account", "credit_card", "goal"] as const;

// Caracteres de control C0 (U+0000-U+001F) y DEL (U+007F) -> se eliminan.
const CONTROL_CHARS = new RegExp("[\\x00-\\x1F\\x7F]", "g");

// Helpers
function str(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.replace(CONTROL_CHARS, "").trim().slice(0, max) || fallback;
}

function money(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, MIN_MONEY), MAX_MONEY);
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function intDay(v: unknown, fallback: number): number {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 31 ? n : fallback;
}

function isISODate(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return !Number.isNaN(Date.parse(v));
}

function lastFour(v: unknown): string {
  const digits = typeof v === "string" ? v.replace(/\D/g, "") : "";
  return digits.slice(-4) || "0000";
}

// Saneadores por entidad
function sanitizeAccount(raw: unknown): DetectedAccount {
  const a = (raw ?? {}) as Record<string, unknown>;
  const kind = pick(a.kind, ACCOUNT_KINDS, "financial_account");
  return {
    kind,
    name: str(a.name, MAX_NAME, "Cuenta importada"),
    institution: str(a.institution, MAX_NAME, "Banco"),
    accountType: pick(a.accountType, ACCOUNT_TYPES, "checking"),
    currency: pick(a.currency, CURRENCIES, "MXN"),
    balance: money(a.balance),
    limit: money(a.limit),
    lastFourDigits: lastFour(a.lastFourDigits),
    cutoffDay: intDay(a.cutoffDay, 1),
    paymentDueDay: intDay(a.paymentDueDay, 20),
    suggestedGoalCategory: a.suggestedGoalCategory as DetectedAccount["suggestedGoalCategory"],
    suggestedGoalName: a.suggestedGoalName ? str(a.suggestedGoalName, MAX_NAME) : undefined,
  };
}

function sanitizeTransactions(raw: unknown): ParsedTransaction[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedTransaction[] = [];
  for (const item of raw.slice(0, MAX_TRANSACTIONS)) {
    const t = (item ?? {}) as Record<string, unknown>;
    if (!isISODate(t.date)) continue;              // descartar fechas invalidas
    const amount = money(t.amount);
    if (amount === 0) continue;                     // sin movimiento
    out.push({
      date: t.date,
      description: str(t.description, MAX_STR, "Sin descripcion"),
      amount,
      type: pick(t.type, TX_TYPES, "expense"),
      category: str(t.category, MAX_CATEGORY, "other") as ParsedTransaction["category"],
      currency: pick(t.currency, CURRENCIES, "MXN"),
      rawLine: "",                                   // no se persiste; descartamos
    });
  }
  return out;
}

function sanitizeGoals(raw: unknown): DetectedGoal[] {
  if (!Array.isArray(raw)) return [];
  const out: DetectedGoal[] = [];
  for (const item of raw.slice(0, MAX_GOALS)) {
    const g = (item ?? {}) as Record<string, unknown>;
    out.push({
      name: str(g.name, MAX_NAME, "Meta"),
      category: str(g.category, MAX_CATEGORY, "custom") as DetectedGoal["category"],
      currentAmount: money(g.currentAmount),
      currency: pick(g.currency, CURRENCIES, "MXN"),
      icon: str(g.icon, 8, "target"),
    });
  }
  return out;
}

/**
 * Sanea y acota un ImportPayload de origen no confiable. Devuelve un payload
 * seguro para escribir en la DB. Trata la entrada como `unknown`.
 */
export function sanitizeImportPayload(raw: unknown): ImportPayload {
  const p = (raw ?? {}) as Record<string, unknown>;
  return {
    account: sanitizeAccount(p.account),
    transactions: sanitizeTransactions(p.transactions),
    goals: sanitizeGoals(p.goals),
  };
}
