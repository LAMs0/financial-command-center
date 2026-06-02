/*
  parsers/wellsfargo.ts — Parser dedicado para estados de cuenta de Wells Fargo
  ──────────────────────────────────────────────────────────────────────────────
  El PDF de Wells Fargo ("Everyday Checking") NO se puede leer con el parser
  genérico de líneas porque:

  1. Las fechas no tienen año: "4/16", "5/1" (formato M/D). El año viene del
     período del estado de cuenta, no de cada renglón.
  2. Cada transacción ocupa VARIAS líneas: la descripción se parte en 2-3
     renglones y el monto aparece al final, separado por tabuladores.
  3. No hay columna de signo: depósito vs retiro se infiere por palabras clave
     ("Payroll", "Purchase", "Zelle to/from", "Online Transfer to/from"...).
  4. El saldo diario solo aparece en algunos renglones.

  Estrategia:
  - Aislar la sección "Historial de transacciones" … hasta "Totales".
  - Agrupar renglones: una transacción nueva empieza con "M/D <tab>".
  - De cada grupo extraer todos los montos (\d+,\d{3}*.\d{2}); el primero es el
    movimiento, y si hay un segundo es el saldo diario.
  - Clasificar depósito/retiro por palabras clave y reusar inferType/inferCategory.
*/

import type { ParsedTransaction } from "../types";
import { inferCategory, inferType } from "../categorize";

export interface WellsFargoResult {
  transactions: ParsedTransaction[];
  finalBalance: number;
}

export interface WellsFargoCardResult {
  transactions: ParsedTransaction[];
  newBalance: number;     // Saldo adeudado de la tarjeta
  creditLimit: number;
  lastFour: string;
}

/**
 * ¿Es un estado de cuenta de TARJETA de crédito Wells Fargo?
 * (layout distinto al de la cuenta de cheques)
 */
export function isWellsFargoCreditCard(text: string): boolean {
  return (
    /reference number\s+description\s+credits\s+charges/i.test(text) ||
    /purchases,\s*balance transfers\s*&\s*other charges/i.test(text) ||
    (/new balance/i.test(text) && /credit limit/i.test(text))
  );
}

// Una línea de transacción de tarjeta WF:
//   [acctEnding] TransDate PostDate Reference Descripción ... Monto[-]
//   "7257 04/13 04/13 2469216FRBX7SSJV0 SQ *LA MICHOACANA... CA 8.75"
//   "04/24 04/24 7414718G20XSL7FFM ONLINE PAYMENT THANK YOU 230.00"
const CARD_TX_RE =
  /^(?:\d{4}\s+)?(\d{1,2}\/\d{1,2})\s+(\d{1,2}\/\d{1,2})\s+([A-Z0-9]{10,})\s+(.+?)\s+(-?[\d,]+\.\d{2})-?\s*$/;

export function parseWellsFargoCreditCard(rawText: string): WellsFargoCardResult {
  // Período: "Statement Period 04/10/2026 to 05/10/2026"
  const periodMatch = rawText.match(/statement period\s+\d{1,2}\/\d{1,2}\/(\d{4})\s+to\s+(\d{1,2})\/\d{1,2}\/(\d{4})/i);
  const year = periodMatch ? parseInt(periodMatch[3], 10) : new Date().getFullYear();
  const stmtMonth = periodMatch ? parseInt(periodMatch[2], 10) : 12;

  const nbMatch = rawText.match(/new balance\s+\$?\s*([\d,]+\.\d{2})/i);
  const newBalance = nbMatch ? parseFloat(nbMatch[1].replace(/,/g, "")) : 0;

  const clMatch = rawText.match(/(?:total\s+)?credit limit\s+\$?\s*([\d,]+)/i);
  const creditLimit = clMatch ? parseFloat(clMatch[1].replace(/,/g, "")) : 0;

  const l4Match = rawText.match(/account ending in\s+(\d{4})/i);
  const lastFour = l4Match ? l4Match[1] : "";

  const lines = rawText.split("\n");
  const transactions: ParsedTransaction[] = [];

  // Sección actual: payments (créditos) vs purchases/fees/interest (cargos)
  type Section = "payment" | "charge" | null;
  let section: Section = null;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
    if (!line) continue;

    // Cambios de sección (los totales se ignoran como transacciones)
    if (/^payments\b/i.test(line) && !/total payments/i.test(line)) { section = "payment"; continue; }
    if (/^purchases,\s*balance transfers/i.test(line) && !/total purchases/i.test(line)) { section = "charge"; continue; }
    if (/^fees charged\b/i.test(line) && !/total fees/i.test(line)) { section = "charge"; continue; }
    if (/^interest charged\b/i.test(line) && !/total interest/i.test(line)) { section = "charge"; continue; }
    if (/^total\b/i.test(line)) continue;

    const m = line.match(CARD_TX_RE);
    if (!m || section === null) continue;

    const [, transDate, , , descRaw, amtRaw] = m;
    const signed = parseFloat(amtRaw.replace(/,/g, ""));
    const amount = Math.abs(signed);
    if (amount === 0) continue; // p. ej. "INTEREST CHARGE ON PURCHASES 0.00"

    const month = parseInt(transDate.split("/")[0], 10);
    const day = parseInt(transDate.split("/")[1], 10);
    const txYear = month > stmtMonth ? year - 1 : year;
    const date = `${txYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const description = descRaw.replace(/\s+/g, " ").slice(0, 200);
    // En una tarjeta: pagos = abono (reduce deuda); compras/cargos = gasto.
    const isCredit = section === "payment";
    const type = inferType(description, amount, isCredit);
    const category = inferCategory(description, type);

    transactions.push({
      date,
      description,
      amount,
      type,
      category,
      currency: "USD",
      rawLine: line.slice(0, 160),
    });
  }

  return { transactions, newBalance, creditLimit, lastFour };
}

// Señales de que el movimiento es un DEPÓSITO/ADICIÓN (entra dinero).
// Todo lo demás se trata como retiro/deducción (la mayoría de los renglones).
const DEPOSIT_SIGNALS =
  /\b(payroll|direct deposit|deposito directo|interest payment|pago de intereses|edeposit|mobile deposit|cash deposit|atm cash deposit)\b|online transfer from|transfer from|zelle from|received from|\b(reversal|refund|rebate|reembolso)\b/i;

const AMOUNT_RE = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
const ENTRY_START_RE = /^(\d{1,2})\/(\d{1,2})\b/; // "4/16", "5/1"

// Líneas de ruido que aparecen entre transacciones (saltos de página, etc.)
function isNoiseLine(l: string): boolean {
  const t = l.trim();
  if (t === "") return true;
  if (/^-{2,}\s*\d+\s+of\s+\d+\s*-{2,}$/i.test(t)) return true;     // "-- 3 of 8 --"
  if (/^p[áa]gina\s+\d+\s+de\s+\d+/i.test(t)) return true;          // "Página 3 de 8"
  if (/^\d{1,2}\s+de\s+[a-záéíóú]+\s+de\s+\d{4}$/i.test(t)) return true; // "15 de mayo de 2026"
  return false;
}

/** Extrae el año del período del estado de cuenta. */
function extractStatementYear(text: string): number {
  const head = text.slice(0, 3000);
  const m = head.match(/\bde\s+(20\d{2})\b/) ?? head.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1], 10) : new Date().getFullYear();
}

/** Saldo final del período: "Saldo final al 5/15 (mes/dia) \t$167.92" */
function extractFinalBalance(text: string): number {
  const m = text.match(/saldo\s+final\s+al[^$\n]*\$?\s*([\d,]+\.\d{2})/i);
  return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
}

export function parseWellsFargo(rawText: string): WellsFargoResult {
  const year = extractStatementYear(rawText);
  const finalBalance = extractFinalBalance(rawText);
  const stmtMonthMatch = rawText.match(/saldo\s+final\s+al\s+(\d{1,2})\//i);
  const stmtMonth = stmtMonthMatch ? parseInt(stmtMonthMatch[1], 10) : 12;

  const allLines = rawText.split("\n");

  // Acotar a la sección de transacciones.
  let start = allLines.findIndex((l) => /historial de transacciones/i.test(l));
  if (start === -1) start = 0;
  let end = allLines.findIndex((l, i) => i > start && /^\s*totales\b/i.test(l));
  if (end === -1) end = allLines.length;

  // Empezar a capturar a partir del primer renglón que arranca con "M/D".
  const region = allLines.slice(start, end).filter((l) => !isNoiseLine(l));

  // Agrupar en entradas multilínea.
  const entries: string[][] = [];
  for (const line of region) {
    if (ENTRY_START_RE.test(line.trim())) {
      entries.push([line]);
    } else if (entries.length > 0) {
      entries[entries.length - 1].push(line);
    }
  }

  const transactions: ParsedTransaction[] = [];

  for (const group of entries) {
    const joined = group.join(" ").replace(/\t/g, " ").replace(/\s+/g, " ").trim();

    const dm = joined.match(ENTRY_START_RE);
    if (!dm) continue;
    const month = parseInt(dm[1], 10);
    const day = parseInt(dm[2], 10);
    // Las transacciones de un mes mayor al del corte pertenecen al año anterior
    // (p. ej. movimientos de diciembre en un estado de cuenta de enero).
    const txYear = month > stmtMonth ? year - 1 : year;
    const date = `${txYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const amounts = (joined.match(AMOUNT_RE) ?? []).map((a) => parseFloat(a.replace(/,/g, "")));
    if (amounts.length === 0) continue;
    const movement = amounts[0];
    if (movement === 0) continue;

    // Descripción: quitar la fecha inicial y los montos del final.
    let description = joined.replace(ENTRY_START_RE, "").trim();
    // Cortar en el primer monto (todo lo que sigue son cifras/saldo).
    const firstAmtIdx = description.search(AMOUNT_RE);
    if (firstAmtIdx > 0) description = description.slice(0, firstAmtIdx).trim();
    description = description.replace(/\s+/g, " ").slice(0, 200) || "Wells Fargo";

    const isCredit = DEPOSIT_SIGNALS.test(joined);
    const type = inferType(description, movement, isCredit);
    const category = inferCategory(description, type);

    transactions.push({
      date,
      description,
      amount: movement,
      type,
      category,
      currency: "USD",
      rawLine: joined.slice(0, 160),
    });
  }

  return { transactions, finalBalance };
}
