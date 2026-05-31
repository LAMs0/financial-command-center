/*
  detect.ts — Clasificación automática de cuentas y detección de metas
  ─────────────────────────────────────────────────────────────────────
  Analiza el nombre de la cuenta, el banco, y los patrones de las
  transacciones para inferir:
  - Tipo de cuenta: checking / savings / credit_card
  - Si la cuenta parece ser una meta de ahorro (y de qué tipo)

  ¿Por qué analizar transacciones y no solo el nombre?
  Muchas cuentas de ahorro se llaman simplemente "Cuenta Nu" o "BBVA".
  Los patrones de transacciones (frecuencia, nómina, intereses) son
  indicadores más confiables que el nombre.
*/

import type { AccountType, GoalCategory } from "@/types/finance";
import type { DetectedAccountKind, DetectedGoal, ParsedTransaction } from "./types";

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ── Detección de tipo de cuenta ────────────────────────────────────────────

const CREDIT_CARD_KEYWORDS = [
  "tarjeta", "credito", "tc ", "tc_", "amex", "american express",
  "visa", "mastercard", "gold", "platinum", "clasica", "azul", "oro",
];

const SAVINGS_KEYWORDS = [
  "ahorro", "saving", "cete", "rendimiento", "plazo fijo",
  "inversion", "deposito", "fondo", "caixinha",
];

const CHECKING_KEYWORDS = [
  "nomina", "debito", "debit", "cheque", "chequera", "cuenta corriente",
  "banco", "eje", "transfer",
];

/** Detecta si el balance final o las transacciones sugieren tarjeta de crédito */
function hasCardTransactionSignals(transactions: ParsedTransaction[]): boolean {
  const creditCardSignals = [
    /interes.*ordinario|interes.*moratorio/i,
    /comision.*anual|anualidad/i,
    /pago.*minimo|pago para no generar/i,
    /limite.*credito|linea.*credito/i,
    /cargo.*automatico.*tc|cargo.*tarjeta/i,
  ];
  const descriptions = transactions.map((t) => t.description);
  return descriptions.some((d) => creditCardSignals.some((p) => p.test(d)));
}

/** Detecta si el archivo parece una cuenta de ahorro por transacciones */
function hasSavingsSignals(transactions: ParsedTransaction[]): boolean {
  const savingsSignals = [
    /interes.*generado|intereses.*acreditados|rendimiento/i,
    /abono.*intereses|credito.*intereses/i,
    /cete|fondo.*inversion/i,
  ];
  return transactions.some((t) => savingsSignals.some((p) => p.test(t.description)));
}

export function detectAccountType(
  accountName: string,
  filename: string,
  transactions: ParsedTransaction[],
  finalBalance: number
): { type: AccountType | "credit_card"; confidence: number } {
  const text = norm(accountName + " " + filename);

  // 1. Keywords explícitas en el nombre o archivo
  if (CREDIT_CARD_KEYWORDS.some((k) => text.includes(k))) {
    return { type: "credit_card", confidence: 0.9 };
  }
  if (SAVINGS_KEYWORDS.some((k) => text.includes(k))) {
    return { type: "savings", confidence: 0.85 };
  }
  if (CHECKING_KEYWORDS.some((k) => text.includes(k))) {
    return { type: "checking", confidence: 0.8 };
  }

  // 2. Señales de transacciones
  if (hasCardTransactionSignals(transactions)) {
    return { type: "credit_card", confidence: 0.8 };
  }
  if (hasSavingsSignals(transactions)) {
    return { type: "savings", confidence: 0.75 };
  }

  // 3. Patrón de nómina (ingreso grande mensual regular) → checking
  const incomeTransactions = transactions.filter((t) => t.type === "income");
  if (incomeTransactions.length > 0) {
    const maxIncome = Math.max(...incomeTransactions.map((t) => t.amount));
    const hasLargeMonthlyDeposit = maxIncome > 5_000 &&
      incomeTransactions.some((t) => /nomina|sueldo|salario/i.test(t.description));
    if (hasLargeMonthlyDeposit) return { type: "checking", confidence: 0.75 };
  }

  // Default: checking (la más común)
  return { type: "checking", confidence: 0.5 };
}

// ── Detección de metas ─────────────────────────────────────────────────────

const GOAL_PATTERNS: Array<{ pattern: RegExp; category: GoalCategory; icon: string }> = [
  { pattern: /emergencia|fondo.?emergencia|colchon/i, category: "emergency_fund", icon: "🛡️" },
  { pattern: /viaje|vacacion|trip|japan|europa|cancun|playa/i, category: "vacation", icon: "✈️" },
  { pattern: /casa|depa|departamento|hipoteca|vivienda|hogar/i, category: "home", icon: "🏠" },
  { pattern: /auto|carro|moto|vehiculo|coche/i, category: "vehicle", icon: "🚗" },
  { pattern: /retiro|pension|jubilacion|afore/i, category: "retirement", icon: "🌅" },
  { pattern: /universidad|maestria|carrera|educacion|curso|estudio/i, category: "education", icon: "🎓" },
  { pattern: /deuda|pagar|liquidar|tarjeta/i, category: "debt_payoff", icon: "💳" },
  // Nu Caixinhas y BBVA "metas"
  { pattern: /meta|objetivo|ahorro.?(para|especial)/i, category: "custom", icon: "🎯" },
];

/**
 * Determina si una cuenta parece una meta de ahorro y sugiere la categoría.
 * Retorna null si no parece una meta.
 */
export function detectGoalFromAccount(
  accountName: string,
  accountType: AccountType | "credit_card",
  balance: number
): DetectedGoal | null {
  // Las metas son cuentas de ahorro, no cuentas corrientes ni tarjetas
  if (accountType === "checking" || accountType === "credit_card") return null;

  const name = accountName.trim();

  for (const { pattern, category, icon } of GOAL_PATTERNS) {
    if (pattern.test(name)) {
      return {
        name,
        category,
        currentAmount: Math.max(balance, 0),
        currency: "MXN",
        icon,
      };
    }
  }

  return null;
}

/**
 * Clasifica el "kind" final de la cuenta detectada:
 * - credit_card → DetectedAccountKind = "credit_card"
 * - savings con nombre de meta → "goal"
 * - cualquier otra → "financial_account"
 */
export function classifyAccountKind(
  accountType: AccountType | "credit_card",
  detectedGoal: DetectedGoal | null
): DetectedAccountKind {
  if (accountType === "credit_card") return "credit_card";
  if (detectedGoal !== null) return "goal";
  return "financial_account";
}

// ── Detección de últimos 4 dígitos (para tarjetas) ─────────────────────────

export function extractLastFourDigits(
  accountName: string,
  accountId: string
): string {
  // Buscar patrón ****1234, *1234, o simplemente 4 dígitos al final
  const match =
    (accountName + " " + accountId).match(/\*{0,4}(\d{4})\s*$/) ??
    accountId.match(/(\d{4})$/);
  return match?.[1] ?? "0000";
}
