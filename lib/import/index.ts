/*
  lib/import/index.ts — Punto de entrada del sistema de importación
  ──────────────────────────────────────────────────────────────────
  Recibe el contenido crudo del archivo + su nombre y devuelve un
  ParsedStatement listo para mostrar en la UI de revisión.

  Flujo:
  1. Detectar formato (CSV vs OFX) por extensión y contenido
  2. Parsear con el parser correspondiente → transacciones + metadata
  3. Detectar tipo de cuenta (checking/savings/credit_card)
  4. Detectar si parece una meta de ahorro
  5. Ensamblar ParsedStatement
*/

import type { AccountType } from "@/types/finance";
import type { ParsedStatement } from "./types";
import type { PDFParseResult } from "./parsers/pdf";
import { parseCSV } from "./parsers/csv";
import { parseOFX } from "./parsers/ofx";
import { parsePDF } from "./parsers/pdf";
import { capParseText } from "./limits";
import {
  classifyAccountKind,
  detectAccountType,
  detectGoalFromAccount,
  extractLastFourDigits,
} from "./detect";

// Colores por defecto para cuentas nuevas
const ACCOUNT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];
let colorIdx = 0;
function nextColor() { return ACCOUNT_COLORS[colorIdx++ % ACCOUNT_COLORS.length]; }

export function parseStatement(
  rawContentRaw: string,
  filename: string
): ParsedStatement {
  // Cota de seguridad: acotar el texto antes de cualquier regex (anti-ReDoS/DoS).
  const rawContent = capParseText(rawContentRaw);
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const isOFX = ext === "ofx" || ext === "qfx" || rawContent.trim().startsWith("OFXHEADER");

  if (isOFX) return parseOFXStatement(rawContent, filename);
  return parseCSVStatement(rawContent, filename);
}

/** Variante async para PDFs (requiere Buffer, no string) */
export async function parsePDFStatement(
  buffer: Buffer,
  filename: string
): Promise<ParsedStatement> {
  const result = await parsePDF(buffer);
  return assembleFromImageLike(result, filename);
}

/** Variante async para imágenes/fotos (jpg, png, webp, heic...) vía OCR */
export async function parseImageStatement(
  buffer: Buffer,
  filename: string
): Promise<ParsedStatement> {
  const { parseImage } = await import("./parsers/image");
  const result = await parseImage(buffer);
  return assembleFromImageLike(result, filename);
}

/** Variante async para Excel (xlsx/xls): se convierte a CSV y se reusa el flujo CSV */
export async function parseXLSXStatement(
  buffer: Buffer,
  filename: string
): Promise<ParsedStatement> {
  const { xlsxToCSV } = await import("./parsers/xlsx");
  const csv = await xlsxToCSV(buffer);
  return parseCSVStatement(csv, filename);
}

/**
 * Ensamblado compartido para resultados que vienen de un PDFParseResult
 * (tanto PDF como imágenes OCR). Mantiene una sola fuente de verdad para
 * la detección de tipo de cuenta, metas y rango de fechas.
 */
function assembleFromImageLike(
  result: PDFParseResult,
  filename: string
): ParsedStatement {
  const warnings = [...result.warnings];

  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim();
  const accountName = result.accountMeta.accountName ?? baseName;

  const { type: detectedType, confidence } = detectAccountType(
    accountName,
    filename,
    result.transactions,
    result.finalBalance
  );

  const goal = detectedType !== "credit_card"
    ? detectGoalFromAccount(accountName, detectedType as import("@/types/finance").AccountType, result.finalBalance, result.currency)
    : null;

  const kind = classifyAccountKind(detectedType, goal);
  const accountType = (detectedType === "credit_card" ? "checking" : detectedType) as import("@/types/finance").AccountType;
  const lastFour = result.accountMeta.accountNumber ?? extractLastFourDigits(accountName, "");
  const dateRange = getDateRange(result.transactions);

  return {
    bank: result.bank,
    bankLabel: result.bankLabel,
    account: {
      kind,
      name: accountName,
      institution: result.bankLabel,
      accountType,
      currency: result.currency,
      balance: Math.abs(result.finalBalance),
      ...(detectedType === "credit_card" && {
        lastFourDigits: lastFour || "0000",
        limit: result.cardLimit ?? 0,
        cutoffDay: 1,
        paymentDueDay: 20,
      }),
      ...(goal && {
        suggestedGoalCategory: goal.category,
        suggestedGoalName: goal.name,
      }),
    },
    transactions: result.transactions,
    goals: goal ? [goal] : [],
    dateRange,
    confidence: result.confidence * confidence,
    warnings,
  };
}

// ── Ensamblar desde CSV ────────────────────────────────────────────────────

function parseCSVStatement(rawContent: string, filename: string): ParsedStatement {
  const result = parseCSV(rawContent);
  const warnings = [...result.warnings];

  // Nombre de cuenta: del metadato extraído o del nombre del archivo
  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim();
  const accountName = result.accountMeta.accountName ?? baseName;

  const { type: detectedType, confidence } = detectAccountType(
    accountName,
    filename,
    result.transactions,
    result.finalBalance
  );

  const goal = detectedType !== "credit_card"
    ? detectGoalFromAccount(accountName, detectedType as AccountType, result.finalBalance, result.currency)
    : null;

  const kind = classifyAccountKind(detectedType, goal);

  const accountType = (detectedType === "credit_card" ? "checking" : detectedType) as AccountType;
  const lastFour = result.accountMeta.accountNumber ?? extractLastFourDigits(accountName, "");

  const dateRange = getDateRange(result.transactions);

  return {
    bank: result.bank,
    bankLabel: result.bankLabel,
    account: {
      kind,
      name: accountName,
      institution: result.bankLabel,
      accountType,
      currency: result.currency,
      balance: Math.abs(result.finalBalance),
      // Campos específicos de tarjeta de crédito
      ...(detectedType === "credit_card" && {
        lastFourDigits: lastFour || "0000",
        limit: 0,      // No se puede inferir del extracto — el usuario lo ajusta
        cutoffDay: 1,
        paymentDueDay: 20,
      }),
      // Campos de meta
      ...(goal && {
        suggestedGoalCategory: goal.category,
        suggestedGoalName: goal.name,
      }),
    },
    transactions: result.transactions,
    goals: goal ? [goal] : [],
    dateRange,
    confidence: result.confidence * (detectedType === "checking" ? confidence : 1),
    warnings,
  };
}

// ── Ensamblar desde OFX ────────────────────────────────────────────────────

function parseOFXStatement(rawContent: string, filename: string): ParsedStatement {
  const result = parseOFX(rawContent);
  const warnings = [...result.warnings];

  const baseName = filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim();
  const accountName = `${result.institution} ${result.accountType === "credit_card" ? "Tarjeta" : "Cuenta"} ${result.accountId.slice(-4)}`.trim();

  const goal = result.accountType === "savings"
    ? detectGoalFromAccount(baseName, "savings", result.finalBalance, result.currency)
    : null;

  const kind = classifyAccountKind(result.accountType, goal);
  const accountType = (result.accountType === "credit_card" ? "checking" : result.accountType) as AccountType;

  const dateRange = getDateRange(result.transactions);

  return {
    bank: "generic",
    bankLabel: result.institution,
    account: {
      kind,
      name: accountName,
      institution: result.institution,
      accountType,
      currency: result.currency,
      balance: Math.abs(result.finalBalance),
      ...(result.accountType === "credit_card" && {
        lastFourDigits: result.accountId.slice(-4) || "0000",
        limit: 0,
        cutoffDay: 1,
        paymentDueDay: 20,
      }),
      ...(goal && {
        suggestedGoalCategory: goal.category,
        suggestedGoalName: goal.name,
      }),
    },
    transactions: result.transactions,
    goals: goal ? [goal] : [],
    dateRange,
    confidence: 0.85,
    warnings,
  };
}

// ── Helper ──────────────────────────────────────────────────────────────────

function getDateRange(transactions: { date: string }[]): { from: string; to: string } {
  if (transactions.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { from: today, to: today };
  }
  const dates = transactions.map((t) => t.date).sort();
  return { from: dates[0], to: dates[dates.length - 1] };
}
