/*
  parsers/csv.ts — Parser de extractos bancarios CSV
  ────────────────────────────────────────────────────
  Estrategia en 3 pasos:
  1. FINGERPRINT: detectar el banco por los encabezados del CSV
  2. MAP: cada banco tiene un "schema" que dice qué columna es fecha, cuál
     es cargo, cuál es abono, etc.
  3. PARSE: iterar las filas y producir ParsedTransaction[]

  ¿Por qué no usar una librería CSV?
  El formato de los bancos mexicanos es muy inconsistente:
  - Algunos usan ; como separador, otros ,
  - Hay filas de encabezado de banco antes de los datos reales
  - Las fechas vienen en DD/MM/YYYY, DD-mes-YYYY, YYYY-MM-DD, etc.
  Un parser a medida nos da control total sobre estos edge cases.
*/

import type { Currency } from "@/types/finance";
import type { DetectedBank, ParsedTransaction } from "../types";
import { inferCategory, inferType } from "../categorize";

// ── Utilidades de parseo ───────────────────────────────────────────────────

/** Parsea un CSV respetando campos entre comillas */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Detecta el delimitador más probable del CSV */
function detectDelimiter(sample: string): string {
  const semicolons = (sample.match(/;/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/** Normaliza un string: minúsculas, sin acentos, sin espacios extra */
function norm(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

/** Convierte montos con formato español/mexicano a number */
function parseMXAmount(str: string): number {
  if (!str || str.trim() === "" || str.trim() === "-") return 0;
  // Quita símbolos y espacios: "$1,234.56" → "1234.56"
  return parseFloat(str.replace(/[$\s]/g, "").replace(/,/g, "")) || 0;
}

/**
 * Parsea fechas de múltiples formatos:
 * DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, "05-ene-2025", "05 enero 2025"
 */
function parseDate(str: string): string {
  const s = str.trim();

  // Ya está en formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Meses en español abreviados/completos
  const MONTHS: Record<string, string> = {
    ene: "01", enero: "01",
    feb: "02", febrero: "02",
    mar: "03", marzo: "03",
    abr: "04", abril: "04",
    may: "05", mayo: "05",
    jun: "06", junio: "06",
    jul: "07", julio: "07",
    ago: "08", agosto: "08",
    sep: "09", septiembre: "09",
    oct: "10", octubre: "10",
    nov: "11", noviembre: "11",
    dic: "12", diciembre: "12",
  };

  // "05-ene-2025" o "05 enero 2025"
  const spanishMatch = s.match(/^(\d{1,2})[-\s]([a-záéíóú]+)[-\s](\d{4})$/i);
  if (spanishMatch) {
    const [, day, monthStr, year] = spanishMatch;
    const month = MONTHS[norm(monthStr)] ?? "01";
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // MM/DD/YYYY (algunos bancos en inglés)
  const mdyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fallback: fecha inválida → hoy
  return new Date().toISOString().slice(0, 10);
}

// ── Fingerprints de bancos ─────────────────────────────────────────────────

/*
  Cada banco tiene un "schema" que define:
  - headers: array de strings normalizados que deben aparecer en los headers
  - col: mapa de nombre lógico → índice de columna (o función de búsqueda)

  El orden en BANK_SCHEMAS importa: el más específico primero.
*/

type ColMap = {
  date: number;
  description: number;
  charge?: number;    // Cargo / Retiro
  credit?: number;    // Abono / Depósito
  amount?: number;    // Monto único (positivo = crédito, negativo = cargo)
  balance?: number;
  currency?: number;
};

type BankSchema = {
  bank: DetectedBank;
  label: string;
  // Al menos estos headers deben estar presentes para hacer match
  requiredHeaders: string[];
  resolveColumns: (headers: string[]) => ColMap | null;
};

const BANK_SCHEMAS: BankSchema[] = [
  // ── BBVA México ─────────────────────────────────────────────────────────
  {
    bank: "bbva_mx",
    label: "BBVA México",
    requiredHeaders: ["fecha", "cargo", "abono", "saldo"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "fecha" || v === "fecha operacion");
      const descIdx = h.findIndex((v) => v.includes("descripcion") || v.includes("concepto") || v.includes("referencia"));
      const chargeIdx = h.findIndex((v) => v === "cargo");
      const creditIdx = h.findIndex((v) => v === "abono");
      const balanceIdx = h.findIndex((v) => v === "saldo");
      if (dateIdx === -1 || descIdx === -1) return null;
      return { date: dateIdx, description: descIdx, charge: chargeIdx, credit: creditIdx, balance: balanceIdx };
    },
  },
  // ── Santander México ─────────────────────────────────────────────────────
  {
    bank: "santander_mx",
    label: "Santander México",
    requiredHeaders: ["fecha operacion", "concepto", "movimiento", "importe"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v.includes("fecha operacion") || v.includes("fecha"));
      const descIdx = h.findIndex((v) => v === "concepto" || v.includes("descripcion"));
      const movIdx = h.findIndex((v) => v === "movimiento");   // "Cargo" / "Abono"
      const amtIdx = h.findIndex((v) => v === "importe");
      const balanceIdx = h.findIndex((v) => v.includes("disponible") || v === "saldo");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx, balance: balanceIdx, _movimiento: movIdx } as ColMap & { _movimiento: number };
    },
  },
  // ── Nu México ────────────────────────────────────────────────────────────
  {
    bank: "nu_mx",
    label: "Nu México",
    requiredHeaders: ["date", "title", "amount"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "date" || v === "fecha");
      const descIdx = h.findIndex((v) => v === "title" || v === "concepto" || v === "descripcion");
      const amtIdx = h.findIndex((v) => v === "amount" || v === "monto");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx };
    },
  },
  // ── Banamex / Citibanamex ────────────────────────────────────────────────
  {
    bank: "banamex",
    label: "Banamex (Citibanamex)",
    requiredHeaders: ["fecha", "depositos", "retiros", "saldo"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "fecha");
      const descIdx = h.findIndex((v) => v.includes("descripcion") || v.includes("concepto"));
      const creditIdx = h.findIndex((v) => v.includes("deposito"));
      const chargeIdx = h.findIndex((v) => v.includes("retiro"));
      const balanceIdx = h.findIndex((v) => v === "saldo");
      if (dateIdx === -1 || descIdx === -1) return null;
      return { date: dateIdx, description: descIdx, charge: chargeIdx, credit: creditIdx, balance: balanceIdx };
    },
  },
  // ── HSBC México ──────────────────────────────────────────────────────────
  {
    bank: "hsbc_mx",
    label: "HSBC México",
    requiredHeaders: ["fecha", "descripcion", "monto", "saldo"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "fecha");
      const descIdx = h.findIndex((v) => v === "descripcion");
      const amtIdx = h.findIndex((v) => v === "monto" || v === "importe");
      const balanceIdx = h.findIndex((v) => v === "saldo");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx, balance: balanceIdx };
    },
  },
  // ── Banorte ──────────────────────────────────────────────────────────────
  {
    bank: "banorte_mx",
    label: "Banorte",
    requiredHeaders: ["fecha", "descripcion", "cargo", "abono"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "fecha");
      const descIdx = h.findIndex((v) => v.includes("descripcion") || v.includes("concepto"));
      const chargeIdx = h.findIndex((v) => v === "cargo");
      const creditIdx = h.findIndex((v) => v === "abono");
      const balanceIdx = h.findIndex((v) => v === "saldo");
      if (dateIdx === -1 || descIdx === -1) return null;
      return { date: dateIdx, description: descIdx, charge: chargeIdx, credit: creditIdx, balance: balanceIdx };
    },
  },
  // ── Scotiabank México ────────────────────────────────────────────────────
  {
    bank: "scotiabank_mx",
    label: "Scotiabank México",
    requiredHeaders: ["fecha", "descripcion", "cargos", "abonos"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "fecha");
      const descIdx = h.findIndex((v) => v.includes("descripcion"));
      const chargeIdx = h.findIndex((v) => v === "cargos");
      const creditIdx = h.findIndex((v) => v === "abonos");
      const balanceIdx = h.findIndex((v) => v === "saldo");
      if (dateIdx === -1 || descIdx === -1) return null;
      return { date: dateIdx, description: descIdx, charge: chargeIdx, credit: creditIdx, balance: balanceIdx };
    },
  },
];

// ── Detección de banco ─────────────────────────────────────────────────────

function detectBankSchema(headers: string[]): BankSchema | null {
  const normalizedHeaders = headers.map(norm);

  for (const schema of BANK_SCHEMAS) {
    const matched = schema.requiredHeaders.every((req) =>
      normalizedHeaders.some((h) => h.includes(req))
    );
    if (matched) return schema;
  }
  return null;
}

/** Encuentra la primera fila que parece ser un encabezado de columnas */
function findHeaderRow(lines: string[][], delimiter: string): number {
  // Buscamos la fila que contiene palabras clave conocidas
  const keywords = ["fecha", "date", "cargo", "abono", "monto", "importe", "saldo", "descripcion", "concepto", "amount"];
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const row = lines[i].map(norm).join(" ");
    const matches = keywords.filter((k) => row.includes(k)).length;
    if (matches >= 2) return i;
  }
  return 0;
}

// ── Extractor de información de la cuenta desde el encabezado del CSV ──────

function extractAccountMeta(preamble: string[]): {
  accountName?: string;
  accountNumber?: string;
  institution?: string;
} {
  const text = preamble.join(" ").toLowerCase();
  let accountName: string | undefined;
  let accountNumber: string | undefined;

  // Buscar número de cuenta (patrones: XXXX XXXX, *1234, terminada en)
  const numMatch = text.match(/(?:cuenta|no\.|numero|terminada en)[:\s]*([*\d\s]{4,20})/i);
  if (numMatch) accountNumber = numMatch[1].trim().replace(/\s+/g, "").slice(-4);

  // Buscar nombre de cuenta
  const nameMatch = text.match(/(?:cuenta|producto)[:\s]+([^\n,;]+)/i);
  if (nameMatch) accountName = nameMatch[1].trim();

  return { accountName, accountNumber };
}

// ── Parseo principal ───────────────────────────────────────────────────────

export interface CSVParseResult {
  bank: DetectedBank;
  bankLabel: string;
  transactions: ParsedTransaction[];
  finalBalance: number;
  currency: Currency;
  confidence: number;
  warnings: string[];
  accountMeta: { accountName?: string; accountNumber?: string };
}

export function parseCSV(rawContent: string): CSVParseResult {
  const warnings: string[] = [];

  // Limpiar BOM y normalizar saltos de línea
  const content = rawContent
    .replace(/^﻿/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return fallbackResult("El archivo está vacío o tiene muy pocas filas.");
  }

  const delimiter = detectDelimiter(lines.slice(0, 5).join("\n"));
  const allRows = lines.map((l) => parseCSVLine(l, delimiter));

  // Buscar la fila de encabezados (puede haber filas de metadata antes)
  const headerRowIdx = findHeaderRow(allRows, delimiter);
  const preamble = lines.slice(0, headerRowIdx);
  const headerRow = allRows[headerRowIdx];
  const dataRows = allRows.slice(headerRowIdx + 1);

  const accountMeta = extractAccountMeta(preamble);

  // Detectar banco
  const schema = detectBankSchema(headerRow);
  if (!schema) {
    warnings.push("No se reconoció el formato del banco. Se aplicó detección genérica.");
    return parseGeneric(dataRows, headerRow, accountMeta, warnings);
  }

  const colMap = schema.resolveColumns(headerRow);
  if (!colMap) {
    warnings.push("Se detectó el banco pero no se pudo mapear las columnas.");
    return parseGeneric(dataRows, headerRow, accountMeta, warnings);
  }

  // Parsear filas de datos
  const transactions: ParsedTransaction[] = [];
  let finalBalance = 0;

  for (const row of dataRows) {
    if (row.length < 2 || !row[colMap.date]) continue;
    const rawDate = row[colMap.date];
    if (!rawDate || rawDate.trim() === "") continue;

    const date = parseDate(rawDate);
    const description = row[colMap.description] ?? "";
    if (!description.trim()) continue;

    let amount = 0;
    let isCredit = false;

    if (colMap.amount !== undefined) {
      // Columna única de monto: negativo = cargo, positivo = abono
      const raw = parseMXAmount(row[colMap.amount] ?? "0");

      // Santander: usa columna "Movimiento" para indicar Cargo/Abono
      const movCol = (colMap as Record<string, number>)["_movimiento"];
      if (movCol !== undefined && movCol >= 0) {
        const movimiento = norm(row[movCol] ?? "");
        isCredit = movimiento.includes("abono") || movimiento.includes("deposito") || movimiento.includes("credito");
        amount = Math.abs(raw);
      } else {
        // Nu y genéricos: negativo = gasto
        isCredit = raw >= 0;
        amount = Math.abs(raw);
      }
    } else {
      // Columnas separadas de cargo y abono
      const charge = parseMXAmount(row[colMap.charge ?? -1] ?? "0");
      const credit = parseMXAmount(row[colMap.credit ?? -1] ?? "0");
      if (charge > 0) { amount = charge; isCredit = false; }
      else if (credit > 0) { amount = credit; isCredit = true; }
      else continue; // Fila sin movimiento
    }

    if (amount === 0) continue;

    if (colMap.balance !== undefined) {
      const bal = parseMXAmount(row[colMap.balance] ?? "0");
      if (bal !== 0) finalBalance = bal;
    }

    const type = inferType(description, amount, isCredit);
    const category = inferCategory(description, type);

    transactions.push({
      date,
      description: description.trim(),
      amount,
      type,
      category,
      currency: "MXN",
      rawLine: row.join(delimiter),
    });
  }

  if (transactions.length === 0) {
    warnings.push("No se encontraron transacciones en el archivo.");
  }

  return {
    bank: schema.bank,
    bankLabel: schema.label,
    transactions,
    finalBalance,
    currency: "MXN",
    confidence: 0.9,
    warnings,
    accountMeta,
  };
}

// ── Parser genérico (fallback) ─────────────────────────────────────────────

function parseGeneric(
  dataRows: string[][],
  headerRow: string[],
  accountMeta: { accountName?: string; accountNumber?: string },
  warnings: string[]
): CSVParseResult {
  const h = headerRow.map(norm);

  // Intentar adivinar columnas por keywords
  const dateIdx = h.findIndex((v) => v.includes("fecha") || v === "date");
  const descIdx = h.findIndex((v) =>
    v.includes("descrip") || v.includes("concepto") || v === "title" || v.includes("detalle")
  );
  const chargeIdx = h.findIndex((v) =>
    v.includes("cargo") || v.includes("retiro") || v.includes("debito") || v.includes("charge")
  );
  const creditIdx = h.findIndex((v) =>
    v.includes("abono") || v.includes("deposito") || v.includes("credito") || v.includes("credit")
  );
  const amtIdx = h.findIndex((v) =>
    v === "monto" || v === "importe" || v === "amount" || v.includes("valor")
  );
  const balIdx = h.findIndex((v) => v === "saldo" || v.includes("disponible") || v === "balance");

  if (dateIdx === -1 || descIdx === -1) {
    return fallbackResult("No se pudo identificar las columnas de fecha y descripción.");
  }

  const transactions: ParsedTransaction[] = [];
  let finalBalance = 0;

  for (const row of dataRows) {
    if (!row[dateIdx] || !row[descIdx]) continue;
    const date = parseDate(row[dateIdx]);
    const description = row[descIdx].trim();
    if (!description) continue;

    let amount = 0;
    let isCredit = false;

    if (amtIdx >= 0) {
      const raw = parseMXAmount(row[amtIdx] ?? "0");
      isCredit = raw >= 0;
      amount = Math.abs(raw);
    } else {
      const charge = chargeIdx >= 0 ? parseMXAmount(row[chargeIdx] ?? "0") : 0;
      const credit = creditIdx >= 0 ? parseMXAmount(row[creditIdx] ?? "0") : 0;
      if (charge > 0) { amount = charge; isCredit = false; }
      else if (credit > 0) { amount = credit; isCredit = true; }
      else continue;
    }

    if (amount === 0) continue;
    if (balIdx >= 0) {
      const bal = parseMXAmount(row[balIdx] ?? "0");
      if (bal !== 0) finalBalance = bal;
    }

    const type = inferType(description, amount, isCredit);
    const category = inferCategory(description, type);

    transactions.push({ date, description, amount, type, category, currency: "MXN", rawLine: row.join(",") });
  }

  return {
    bank: "generic",
    bankLabel: "Banco desconocido",
    transactions,
    finalBalance,
    currency: "MXN",
    confidence: 0.5,
    warnings,
    accountMeta,
  };
}

function fallbackResult(warning: string): CSVParseResult {
  return {
    bank: "generic",
    bankLabel: "No detectado",
    transactions: [],
    finalBalance: 0,
    currency: "MXN",
    confidence: 0,
    warnings: [warning],
    accountMeta: {},
  };
}
