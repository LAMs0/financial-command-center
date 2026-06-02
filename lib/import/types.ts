/*
  lib/import/types.ts — Contratos del sistema de importación de extractos
  ────────────────────────────────────────────────────────────────────────
  Tipos intermedios que viven SOLO durante el proceso de importación.
  No son tipos de dominio (types/finance.ts) — son el "estado temporal"
  entre el archivo crudo del banco y los registros en la DB.
*/

import type { AccountType, Currency, GoalCategory, TransactionCategory, TransactionType } from "@/types/finance";

// ── Banco detectado ────────────────────────────────────────────────────────

export type DetectedBank =
  // México
  | "bbva_mx"
  | "santander_mx"
  | "nu_mx"
  | "banamex"
  | "hsbc_mx"
  | "banorte_mx"
  | "scotiabank_mx"
  // Estados Unidos
  | "chase"
  | "bofa"
  | "wells_fargo"
  | "citi_us"
  | "capital_one"
  | "amex_us"
  | "discover"
  | "us_bank"
  | "pnc"
  | "ally"
  | "generic";

// ── Tipo de resultado de la cuenta detectada ───────────────────────────────

export type DetectedAccountKind =
  | "financial_account"   // FinancialAccount (checking/savings/cash)
  | "credit_card"         // CreditCard
  | "goal";               // Sugerencia de crear una Meta en lugar de cuenta

// ── Transacción parseada (antes de guardar) ────────────────────────────────

export interface ParsedTransaction {
  date: string;                // "YYYY-MM-DD"
  description: string;
  amount: number;              // Siempre positivo
  type: TransactionType;       // Inferido: income | expense | transfer
  category: TransactionCategory;
  currency: Currency;
  rawLine: string;             // Línea original del CSV para debug
}

// ── Cuenta detectada (antes de guardar) ───────────────────────────────────

export interface DetectedAccount {
  kind: DetectedAccountKind;
  // Datos para FinancialAccount o CreditCard
  name: string;
  institution: string;
  accountType: AccountType;    // Solo relevante si kind === "financial_account"
  currency: Currency;
  balance: number;             // Saldo final del extracto
  // Solo para tarjetas de crédito
  limit?: number;
  lastFourDigits?: string;
  cutoffDay?: number;
  paymentDueDay?: number;
  // Solo si kind === "goal"
  suggestedGoalCategory?: GoalCategory;
  suggestedGoalName?: string;
}

// ── Meta detectada (extractos con sub-cuentas de ahorro) ──────────────────

export interface DetectedGoal {
  name: string;
  category: GoalCategory;
  currentAmount: number;
  currency: Currency;
  icon: string;
}

// ── Resultado completo del parseo ─────────────────────────────────────────

export interface ParsedStatement {
  bank: DetectedBank;
  bankLabel: string;
  account: DetectedAccount;
  transactions: ParsedTransaction[];
  goals: DetectedGoal[];         // Sub-cuentas de ahorro detectadas
  dateRange: { from: string; to: string };
  confidence: number;            // 0–1: qué tan seguros estamos de la detección
  warnings: string[];            // Advertencias para mostrar al usuario
}

// ── Payload del Server Action de guardado ─────────────────────────────────

export interface ImportPayload {
  account: DetectedAccount;
  transactions: ParsedTransaction[];
  goals: DetectedGoal[];
}
