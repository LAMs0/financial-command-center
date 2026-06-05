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
import { parseLocaleDate, resolveLocale } from "../locale";
import { parseWellsFargo, parseWellsFargoCreditCard, isWellsFargoCreditCard } from "./wellsfargo";
import { capParseText } from "../limits";
import { logger } from "@/lib/logger";

// ── Tipos internos ─────────────────────────────────────────────────────────

export interface PDFParseResult {
  bank: DetectedBank;
  bankLabel: string;
  transactions: ParsedTransaction[];
  finalBalance: number;
  currency: Currency;
  confidence: number;
  warnings: string[];
  /** Límite de crédito detectado (tarjetas). El ensamblado lo usa para autollenar. */
  cardLimit?: number;
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

// Las fechas se parsean con parseLocaleDate (lib/import/locale.ts), que
// respeta el orden DD/MM (México) vs MM/DD (EE. UU.) según el banco.

// ── Detección de banco por texto del PDF ───────────────────────────────────

function detectBankFromText(text: string): { bank: DetectedBank; bankLabel: string } {
  const t = norm(text.slice(0, 2000)); // Solo analizar el inicio del documento

  // ── Estados Unidos (revisar primero los nombres más específicos) ──────────
  if (t.includes("bank of america") || t.includes("bankofamerica")) return { bank: "bofa", bankLabel: "Bank of America" };
  if (t.includes("wells fargo")) return { bank: "wells_fargo", bankLabel: "Wells Fargo" };
  if (t.includes("capital one")) return { bank: "capital_one", bankLabel: "Capital One" };
  if (t.includes("american express") || t.includes("americanexpress") || t.includes("amex")) return { bank: "amex_us", bankLabel: "American Express" };
  if (t.includes("discover")) return { bank: "discover", bankLabel: "Discover" };
  if (t.includes("u.s. bank") || t.includes("us bank") || t.includes("usbank")) return { bank: "us_bank", bankLabel: "U.S. Bank" };
  if (t.includes("pnc bank") || /\bpnc\b/.test(t)) return { bank: "pnc", bankLabel: "PNC Bank" };
  if (t.includes("ally bank") || /\bally\b/.test(t)) return { bank: "ally", bankLabel: "Ally Bank" };
  if (t.includes("jpmorgan") || t.includes("chase")) return { bank: "chase", bankLabel: "Chase" };

  // ── México ────────────────────────────────────────────────────────────────
  if (t.includes("bbva")) return { bank: "bbva_mx", bankLabel: "BBVA México" };
  if (t.includes("santander")) return { bank: "santander_mx", bankLabel: "Santander México" };
  if (t.includes("nubank") || t.includes("nu mexico") || t.includes("nu financial")) return { bank: "nu_mx", bankLabel: "Nu México" };
  if (t.includes("citibanamex") || t.includes("banamex")) return { bank: "banamex", bankLabel: "Banamex (Citibanamex)" };
  if (t.includes("citibank") || t.includes("citi ")) return { bank: "citi_us", bankLabel: "Citi" };
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
  line: string,
  dateOrder: "dmy" | "mdy" = "dmy"
): { date: string; description: string; charge: number; credit: number } | null {
  const trimmed = line.trim();
  if (trimmed.length < 10) return null;

  const dateMatch = trimmed.match(DATE_AT_START);
  if (!dateMatch) return null;

  const date = parseLocaleDate(dateMatch[1], dateOrder);
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

  // ── Paso 1: intentar extraer la capa de texto (PDFs digitales) ──────────
  let rawText = "";
  let numpages = 0;
  let textLayerFailed = false;

  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    rawText = textResult.text ?? "";
    numpages = textResult.pages.length;
  } catch (err) {
    // No abortamos: puede ser un PDF escaneado. Caemos al OCR abajo.
    textLayerFailed = true;
    logger.warn("import.pdf_text_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // ── Paso 2: fallback OCR para PDFs escaneados (imagen sin texto) ─────────
  let ocrUsed = false;
  if (!rawText || rawText.trim().length < 50) {
    try {
      const { ocrPdfBuffer } = await import("./ocr");
      const ocrText = await ocrPdfBuffer(buffer);
      if (ocrText && ocrText.trim().length >= 20) {
        rawText = ocrText;
        ocrUsed = true;
        warnings.push("PDF escaneado: el texto se reconstruyó con OCR. Revisa los montos y fechas con cuidado.");
      }
    } catch (err) {
      logger.warn("import.pdf_ocr_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Si después de todo no hay texto, reportamos el motivo más útil ──────
  if (!rawText || rawText.trim().length < 20) {
    return {
      bank: "generic", bankLabel: "No detectado",
      transactions: [], finalBalance: 0, currency: "MXN",
      confidence: 0,
      warnings: [
        textLayerFailed
          ? "No se pudo leer el PDF. Puede estar protegido con contraseña o dañado."
          : "El PDF no contiene texto legible, ni siquiera con OCR. Si es una foto borrosa, intenta con una imagen más nítida o exporta el CSV desde tu banca en línea.",
      ],
      accountMeta: {},
    };
  }

  const result = buildPDFResult(rawText, numpages, warnings);
  // El OCR es menos confiable que la capa de texto nativa.
  if (ocrUsed) result.confidence = Math.min(result.confidence, 0.55);
  return result;
}

/**
 * Construye el PDFParseResult a partir del texto plano (venga de la capa
 * de texto del PDF o de OCR). Separar esto permite reusar exactamente la
 * misma lógica de detección de banco + extracción de transacciones para
 * ambos orígenes y también para imágenes sueltas.
 */
export function buildPDFResult(
  rawTextRaw: string,
  numpages: number,
  warnings: string[] = []
): PDFParseResult {
  // Cota de seguridad: acotar el texto antes de cualquier regex (anti-ReDoS/DoS).
  const rawText = capParseText(rawTextRaw, warnings);
  const { bank, bankLabel } = detectBankFromText(rawText);
  const meta = extractAccountMetaFromText(rawText);

  // Locale (moneda + orden de fecha): por banco, o heurística si es genérico
  const { currency, dateOrder } = resolveLocale(bank, rawText.slice(0, 4000));

  // ── Wells Fargo usa layouts propios → parsers dedicados ───────────────────
  if (bank === "wells_fargo") {
    // Tarjeta de crédito: tabla "Payments / Purchases" de una línea por tx.
    if (isWellsFargoCreditCard(rawText)) {
      const cc = parseWellsFargoCreditCard(rawText);
      if (cc.transactions.length > 0) {
        // Nombre con "Visa" para que detectAccountType lo marque como tarjeta.
        const cardNameMatch = rawText.match(/(wells fargo[^\n]*\b(?:visa|mastercard|active cash|autograph|reflect)[^\n]*?card)/i);
        const cardName = cardNameMatch ? cardNameMatch[1].replace(/®|™/g, "").replace(/\s+/g, " ").trim() : "Wells Fargo Credit Card";
        return {
          bank,
          bankLabel,
          transactions: cc.transactions,
          finalBalance: cc.newBalance,
          currency,
          confidence: 0.85,
          warnings,
          cardLimit: cc.creditLimit,
          accountMeta: { accountName: cardName, accountNumber: cc.lastFour || meta.accountNumber, institution: bankLabel },
        };
      }
    }

    // Cuenta de cheques/ahorro: layout multilínea "Historial de transacciones".
    const wf = parseWellsFargo(rawText);
    if (wf.transactions.length > 0) {
      return {
        bank,
        bankLabel,
        transactions: wf.transactions,
        finalBalance: wf.finalBalance,
        currency,
        confidence: 0.85,
        warnings,
        accountMeta: { accountNumber: meta.accountNumber, institution: bankLabel },
      };
    }
    // Si los parsers dedicados no encontraron nada, caemos al genérico de abajo.
  }

  const lines = rawText.split("\n");
  const zoneStart = findTransactionZoneStart(lines);
  const transactionLines = lines.slice(zoneStart);

  const transactions: ParsedTransaction[] = [];
  let finalBalance = meta.finalBalance ?? 0;

  for (const line of transactionLines) {
    const parsed = parseTransactionLine(line, dateOrder);
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
      currency,
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

  if (numpages > 20) {
    warnings.push(`El PDF tiene ${numpages} páginas. Solo se procesaron los movimientos encontrados.`);
  }

  return {
    bank,
    bankLabel,
    transactions,
    finalBalance,
    currency,
    confidence: transactions.length > 0 ? (bank !== "generic" ? 0.82 : 0.6) : 0,
    warnings,
    accountMeta: {
      accountNumber: meta.accountNumber,
      institution: bankLabel,
    },
  };
}
