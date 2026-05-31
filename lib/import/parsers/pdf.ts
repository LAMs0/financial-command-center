/*
  parsers/pdf.ts — Parser de extractos bancarios en PDF
  ───────────────────────────────────────────────────────
  Estrategia:
  1. pdf-parse extrae el texto plano del PDF (sin layout de tabla)
  2. Dividimos en líneas y buscamos la "zona de transacciones"
  3. Cada línea se analiza con regex para extraer fecha + descripción + montos

  ¿Por qué regex y no columnas fijas?
  En PDFs el texto llega sin separadores — las columnas se representan
  solo con espacios. La extracción de pdf-parse colapsa esos espacios
  de forma inconsistente entre bancos. Regex que busca patrones de fecha
  + números es más robusto que asumir posiciones fijas.

  Bancos soportados con detección específica:
  BBVA, Santander, Nu, Banamex, HSBC, Banorte, Scotiabank + genérico.
*/

import type { Currency } from "@/types/finance";
import type { DetectedBank, ParsedTransaction } from "../types";
import { inferCategory, inferType } from "../categorize";

// ── Tipos internos ─────────────────────────────────────────────────────────

export interface PDFParseResult {
  bank: DetectedBank;
  bankLabel: string;
  transactions: ParsedTransaction[];
  finalBalance: number;
  currency: Currency;
  confidence: number;
  warnings: string[];
  accountMeta: {
    accountName?: string;
    accountNumber?: string;
    institution?: string;
  };
}

// ── Normalización ──────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function parseMXAmount(s: string): number {
  const clean = s.replace(/[$,\s]/g, "");
  return parseFloat(clean) || 0;
}

/**
 * Parsea fechas en los formatos más comunes de extractos PDF mexicanos:
 * DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, "05 ene 2025", "05-ENE-25"
 */
function parseDate(raw: string): string {
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const MONTHS: Record<string, string> = {
    ene: "01", feb: "02", mar: "03", abr: "04",
    may: "05", jun: "06", jul: "07", ago: "08",
    sep: "09", oct: "10", nov: "11", dic: "12",
    jan: "01", apr: "04", aug: "08", dec: "12",
  };

  // "05-ENE-25" o "05 ene 2025"
  const spanishMatch = s.match(/^(\d{1,2})[-\/\s]([a-záéíóú]{3,})[-\/\s](\d{2,4})$/i);
  if (spanishMatch) {
    const [, day, mon, yr] = spanishMatch;
    const month = MONTHS[norm(mon.slice(0, 3))] ?? "01";
    const year = yr.length === 2 ? `20${yr}` : yr;
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  // DD/MM/YYYY o DD/MM/YY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

// ── Detección de banco por texto del PDF ───────────────────────────────────

function detectBankFromText(text: string): { bank: DetectedBank; bankLabel: string } {
  const t = norm(text.slice(0, 2000)); // Solo analizar el inicio del documento

  if (t.includes("bbva")) return { bank: "bbva_mx", bankLabel: "BBVA México" };
  if (t.includes("santander")) return { bank: "santander_mx", bankLabel: "Santander México" };
  if (t.includes("nubank") || t.includes("nu mexico") || t.includes("nu financial")) return { bank: "nu_mx", bankLabel: "Nu México" };
  if (t.includes("banamex") || t.includes("citibanamex") || t.includes("citi")) return { bank: "banamex", bankLabel: "Banamex (Citibanamex)" };
  if (t.includes("hsbc")) return { bank: "hsbc_mx", bankLabel: "HSBC México" };
  if (t.includes("banorte")) return { bank: "banorte_mx", bankLabel: "Banorte" };
  if (t.includes("scotiabank")) return { bank: "scotiabank_mx", bankLabel: "Scotiabank México" };
  if (t.includes("inbursa")) return { bank: "generic", bankLabel: "Inbursa" };
  if (t.includes("azteca")) return { bank: "generic", bankLabel: "Banco Azteca" };

  return { bank: "generic", bankLabel: "Banco (PDF)" };
}

// ── Extracción de metadata de cuenta ──────────────────────────────────────

function extractAccountMetaFromText(text: string): {
  accountName?: string;
  accountNumber?: string;
  finalBalance?: number;
} {
  const lines = text.split("\n").slice(0, 50).join("\n");

  // Número de cuenta
  const numPatterns = [
    /(?:cuenta|no\.?|numero)[:\s#]*([*\d\s\-]{6,25})/i,
    /(?:tarjeta|card)[:\s#]*([*\d\s\-]{10,20})/i,
    /\*{4}\s*(\d{4})/,   // ****1234
  ];
  let accountNumber: string | undefined;
  for (const p of numPatterns) {
    const m = lines.match(p);
    if (m) { accountNumber = m[1].trim().replace(/\s+/g, "").slice(-4); break; }
  }

  // Saldo final
  const balancePatterns = [
    /saldo\s+(?:final|actual|al\s+corte)[:\s]*([\d,]+\.\d{2})/i,
    /saldo\s+disponible[:\s]*([\d,]+\.\d{2})/i,
  ];
  let finalBalance: number | undefined;
  for (const p of balancePatterns) {
    const m = text.match(p);
    if (m) { finalBalance = parseMXAmount(m[1]); break; }
  }

  return { accountNumber, finalBalance };
}

// ── Detección de la zona de transacciones ─────────────────────────────────

/*
  Los PDFs bancarios tienen una tabla de movimientos precedida por encabezados.
  Buscamos la línea que inicia la tabla y de ahí en adelante parseamos.
*/
const TABLE_START_PATTERNS = [
  /fecha\s+(?:de\s+)?(?:operacion|movimiento|transaccion)/i,
  /fecha\s+descripcion/i,
  /fecha\s+concepto/i,
  /fecha\s+cargo\s+abono/i,
  /date\s+description/i,
  /movimientos\s+del\s+periodo/i,
  /detalle\s+de\s+movimientos/i,
];

function findTransactionZoneStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (TABLE_START_PATTERNS.some((p) => p.test(l))) return i + 1;
  }
  // Fallback: buscar la primera línea que tiene el patrón de fecha
  for (let i = 0; i < lines.length; i++) {
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(lines[i].trim())) return i;
  }
  return 0;
}

// ── Regex para parsear líneas de transacciones ─────────────────────────────

/*
  Una línea de transacción típica en PDF tiene este patrón:
  "DD/MM/YYYY  DESCRIPCION...  1,234.56  12,345.67"
  o
  "DD/MM/YYYY  DESCRIPCION...  1,234.56  (abono)"

  El reto: la descripción puede contener números (ej: "OXXO 7711")
  Los montos siempre terminan con .NN y suelen estar al final de la línea.
*/

// Detecta si un token parece ser un monto monetario
function isAmount(token: string): boolean {
  return /^\d{1,3}(,\d{3})*\.\d{2}$/.test(token.replace(/[$]/g, ""));
}

// Fecha al inicio de la línea (DD/MM/YY o DD-MM-YY o DD/MM/YYYY)
const DATE_AT_START = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}[-\s][a-záéíóú]{3}[-\s]\d{2,4})\s+/i;

function parseTransactionLine(
  line: string
): { date: string; description: string; charge: number; credit: number } | null {
  const trimmed = line.trim();
  if (trimmed.length < 10) return null;

  const dateMatch = trimmed.match(DATE_AT_START);
  if (!dateMatch) return null;

  const date = parseDate(dateMatch[1]);
  const rest = trimmed.slice(dateMatch[0].length).trim();

  // Dividir en tokens por espacios de 2+ caracteres (heurística para separar columnas)
  // Primero intentar con espacios dobles (más fiable en PDFs bien extraídos)
  const tokens = rest.split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);

  // Identificar los montos al final
  const amounts: number[] = [];
  let descEndIdx = tokens.length;

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (isAmount(tokens[i])) {
      amounts.unshift(parseMXAmount(tokens[i]));
      descEndIdx = i;
    } else {
      break;
    }
  }

  // Si no encontramos montos con el método de tokens, intentar regex sobre el final de línea
  if (amounts.length === 0) {
    const amountPattern = /([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?\s*$/;
    const amMatch = rest.match(amountPattern);
    if (!amMatch) return null;

    amounts.push(parseMXAmount(amMatch[1]));
    if (amMatch[2]) amounts.push(parseMXAmount(amMatch[2]));

    const descRaw = rest.slice(0, rest.length - amMatch[0].length).trim();
    return buildResult(date, descRaw, amounts);
  }

  const descRaw = tokens.slice(0, descEndIdx).join(" ").trim();
  if (!descRaw) return null;

  return buildResult(date, descRaw, amounts);
}

function buildResult(
  date: string,
  description: string,
  amounts: number[]
): { date: string; description: string; charge: number; credit: number } {
  // Heurística: si hay 2 montos → [cargo, saldo] o [cargo, abono]
  // Si hay 1 monto → puede ser cargo o abono según el contexto de la descripción
  if (amounts.length >= 2) {
    // El segundo suele ser el saldo corriente, no el movimiento
    // Pero si el primero es muy grande comparado con el segundo, puede ser al revés
    return { date, description, charge: amounts[0], credit: 0 };
  }
  return { date, description, charge: amounts[0], credit: 0 };
}

// ── Función pública de parseo PDF ──────────────────────────────────────────

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  // Import dinámico — Node.js only, nunca llega al bundle del cliente
  const { PDFParse } = await import("pdf-parse");
  const warnings: string[] = [];

  let pdfData: { text: string; numpages: number };
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    pdfData = { text: textResult.text, numpages: textResult.pages.length };
  } catch {
    return {
      bank: "generic", bankLabel: "No detectado",
      transactions: [], finalBalance: 0, currency: "MXN",
      confidence: 0,
      warnings: ["No se pudo leer el PDF. Asegúrate de que no esté protegido con contraseña."],
      accountMeta: {},
    };
  }

  const rawText = pdfData.text;
  if (!rawText || rawText.trim().length < 50) {
    return {
      bank: "generic", bankLabel: "No detectado",
      transactions: [], finalBalance: 0, currency: "MXN",
      confidence: 0,
      warnings: ["El PDF no contiene texto extraíble. Puede ser un PDF escaneado (imagen). Por ahora solo se soportan PDFs con texto seleccionable."],
      accountMeta: {},
    };
  }

  const { bank, bankLabel } = detectBankFromText(rawText);
  const meta = extractAccountMetaFromText(rawText);

  const lines = rawText.split("\n");
  const zoneStart = findTransactionZoneStart(lines);
  const transactionLines = lines.slice(zoneStart);

  const transactions: ParsedTransaction[] = [];
  let finalBalance = meta.finalBalance ?? 0;
  let lastBalance = 0;

  for (const line of transactionLines) {
    const parsed = parseTransactionLine(line);
    if (!parsed) continue;

    const { date, description, charge, credit } = parsed;
    const amount = charge > 0 ? charge : credit;
    if (amount === 0 || amount > 1_000_000) continue; // Filtrar saldos disfrazados de movimientos

    const isCredit = credit > 0;
    const type = inferType(description, amount, isCredit);
    const category = inferCategory(description, type);

    transactions.push({
      date,
      description: description.slice(0, 200),
      amount,
      type,
      category,
      currency: "MXN",
      rawLine: line.trim(),
    });
  }

  if (transactions.length === 0) {
    warnings.push(
      "No se encontraron transacciones en el PDF. " +
      "Si el banco imprime el extracto como imagen dentro del PDF, " +
      "descarga el formato CSV desde tu banca en línea."
    );
  }

  // Intentar extraer el saldo final del texto si no lo encontramos antes
  if (finalBalance === 0 && transactions.length > 0) {
    const lastLine = rawText.match(/([\d,]+\.\d{2})\s*$/m);
    if (lastLine) finalBalance = parseMXAmount(lastLine[1]);
  }

  if (pdfData.numpages > 20) {
    warnings.push(`El PDF tiene ${pdfData.numpages} páginas. Solo se procesaron los movimientos encontrados.`);
  }

  return {
    bank,
    bankLabel,
    transactions,
    finalBalance,
    currency: "MXN",
    confidence: transactions.length > 0 ? (bank !== "generic" ? 0.82 : 0.6) : 0,
    warnings,
    accountMeta: {
      accountNumber: meta.accountNumber,
      institution: bankLabel,
    },
  };
}
