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
import { BANK_LOCALE, parseLocaleDate, resolveLocale } from "../locale";

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

// Las fechas se parsean con parseLocaleDate (lib/import/locale.ts), que
// respeta el orden DD/MM (México) vs MM/DD (EE. UU.) según el banco detectado.

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
  // Para columna única de monto: si true, POSITIVO = cargo (gasto).
  // Lo usan tarjetas de EE. UU. como Amex y Discover.
  invertAmount?: boolean;
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

  // ════════════════════ BANCOS DE ESTADOS UNIDOS ════════════════════════════

  // ── Chase (checking/savings) ──────────────────────────────────────────────
  // Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
  {
    bank: "chase",
    label: "Chase",
    requiredHeaders: ["posting date", "description", "amount", "balance"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v.includes("posting date") || v.includes("post date") || v === "date");
      const descIdx = h.findIndex((v) => v === "description");
      const amtIdx = h.findIndex((v) => v === "amount");
      const balanceIdx = h.findIndex((v) => v === "balance");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx, balance: balanceIdx };
    },
  },
  // ── Chase / genérico de tarjeta: Transaction Date,Post Date,Description,Category,Type,Amount
  {
    bank: "chase",
    label: "Chase (tarjeta)",
    requiredHeaders: ["transaction date", "description", "amount"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v.includes("transaction date"));
      const descIdx = h.findIndex((v) => v === "description");
      const amtIdx = h.findIndex((v) => v === "amount");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx };
    },
  },
  // ── Bank of America: Date,Description,Amount,Running Bal. ──────────────────
  {
    bank: "bofa",
    label: "Bank of America",
    requiredHeaders: ["date", "description", "amount", "running bal"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "date");
      const descIdx = h.findIndex((v) => v === "description");
      const amtIdx = h.findIndex((v) => v === "amount");
      const balanceIdx = h.findIndex((v) => v.includes("running bal"));
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx, balance: balanceIdx };
    },
  },
  // ── Capital One (tarjeta): Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit
  {
    bank: "capital_one",
    label: "Capital One",
    requiredHeaders: ["description", "debit", "credit"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v.includes("transaction date") || v.includes("posted date") || v === "date");
      const descIdx = h.findIndex((v) => v === "description");
      const chargeIdx = h.findIndex((v) => v === "debit");
      const creditIdx = h.findIndex((v) => v === "credit");
      if (dateIdx === -1 || descIdx === -1) return null;
      return { date: dateIdx, description: descIdx, charge: chargeIdx, credit: creditIdx };
    },
  },
  // ── American Express: Date,Description,Amount  (POSITIVO = cargo) ──────────
  {
    bank: "amex_us",
    label: "American Express",
    requiredHeaders: ["date", "description", "amount"],
    invertAmount: true,
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      // Solo matchea si NO tiene "balance"/"running bal" (eso sería BofA/Chase)
      if (h.some((v) => v.includes("balance") || v.includes("running bal") || v.includes("posting date") || v.includes("transaction date"))) return null;
      const dateIdx = h.findIndex((v) => v === "date");
      const descIdx = h.findIndex((v) => v === "description");
      const amtIdx = h.findIndex((v) => v === "amount");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx };
    },
  },
  // ── Discover: Trans. Date,Post Date,Description,Amount,Category (POSITIVO = cargo)
  {
    bank: "discover",
    label: "Discover",
    requiredHeaders: ["trans. date", "description", "amount"],
    invertAmount: true,
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v.includes("trans. date") || v.includes("trans date"));
      const descIdx = h.findIndex((v) => v === "description");
      const amtIdx = h.findIndex((v) => v === "amount");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx };
    },
  },
  // ── Citi (tarjeta): Status,Date,Description,Debit,Credit ───────────────────
  {
    bank: "citi_us",
    label: "Citi",
    requiredHeaders: ["status", "date", "description", "debit"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "date");
      const descIdx = h.findIndex((v) => v === "description");
      const chargeIdx = h.findIndex((v) => v === "debit");
      const creditIdx = h.findIndex((v) => v === "credit");
      if (dateIdx === -1 || descIdx === -1) return null;
      return { date: dateIdx, description: descIdx, charge: chargeIdx, credit: creditIdx };
    },
  },
  // ── US Bank: Date,Transaction,Name,Memo,Amount ────────────────────────────
  {
    bank: "us_bank",
    label: "U.S. Bank",
    requiredHeaders: ["date", "transaction", "name", "amount"],
    resolveColumns: (headers) => {
      const h = headers.map(norm);
      const dateIdx = h.findIndex((v) => v === "date");
      const descIdx = h.findIndex((v) => v === "name" || v === "memo");
      const amtIdx = h.findIndex((v) => v === "amount");
      if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) return null;
      return { date: dateIdx, description: descIdx, amount: amtIdx };
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
function findHeaderRow(lines: string[][]): number {
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

  // ── Caso especial: CSV SIN encabezados (Wells Fargo) ──────────────────────
  // Formato: Fecha, Monto, "*", "", Descripción  (sin fila de títulos)
  if (looksLikeWellsFargoCSV(allRows)) {
    return parseWellsFargoCSV(allRows, warnings);
  }

  // Buscar la fila de encabezados (puede haber filas de metadata antes)
  const headerRowIdx = findHeaderRow(allRows);
  const preamble = lines.slice(0, headerRowIdx);
  const headerRow = allRows[headerRowIdx];
  const dataRows = allRows.slice(headerRowIdx + 1);

  const accountMeta = extractAccountMeta(preamble);

  // Detectar banco
  const schema = detectBankSchema(headerRow);
  if (!schema) {
    warnings.push("No se reconoció el formato del banco. Se aplicó detección genérica.");
    return parseGeneric(dataRows, headerRow, accountMeta, warnings, content);
  }

  const colMap = schema.resolveColumns(headerRow);
  if (!colMap) {
    warnings.push("Se detectó el banco pero no se pudo mapear las columnas.");
    return parseGeneric(dataRows, headerRow, accountMeta, warnings, content);
  }

  // Locale (moneda + orden de fecha) según el banco detectado
  const locale = BANK_LOCALE[schema.bank];
  const { currency, dateOrder } = locale;

  // Parsear filas de datos
  const transactions: ParsedTransaction[] = [];
  let finalBalance = 0;

  for (const row of dataRows) {
    if (row.length < 2 || !row[colMap.date]) continue;
    const rawDate = row[colMap.date];
    if (!rawDate || rawDate.trim() === "") continue;

    const date = parseLocaleDate(rawDate, dateOrder);
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
      } else if (schema.invertAmount) {
        // Amex / Discover: positivo = cargo (gasto), negativo = abono/pago
        isCredit = raw < 0;
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
      currency,
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
    currency,
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
  warnings: string[],
  fullContent = ""
): CSVParseResult {
  const h = headerRow.map(norm);

  // Resolver moneda + orden de fecha por heurística (banco desconocido)
  const sample = fullContent.slice(0, 4000) + " " + dataRows.slice(0, 10).map((r) => r.join(" ")).join(" ");
  const { currency, dateOrder } = resolveLocale("generic", sample);

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
    const date = parseLocaleDate(row[dateIdx], dateOrder);
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

    transactions.push({ date, description, amount, type, category, currency, rawLine: row.join(",") });
  }

  return {
    bank: "generic",
    bankLabel: "Banco desconocido",
    transactions,
    finalBalance,
    currency,
    confidence: 0.5,
    warnings,
    accountMeta,
  };
}

// ── Wells Fargo: CSV sin encabezados ───────────────────────────────────────
/*
  Wells Fargo exporta el CSV SIN fila de títulos, con 5 columnas:
    "04/16/2026","-71.99","*","","MONEY TRANSFER AUTHORIZED ON ..."
  Col 0 = Fecha (MM/DD/YYYY), Col 1 = Monto (negativo = retiro, positivo = depósito),
  Col 4 = Descripción. Las columnas 2 y 3 casi siempre son "*" y "".
*/

function looksLikeWellsFargoCSV(rows: string[][]): boolean {
  // Tomamos una muestra de las primeras filas con datos.
  const sample = rows.slice(0, 8).filter((r) => r.length >= 4);
  if (sample.length < 2) return false;

  let matches = 0;
  for (const r of sample) {
    const dateOk = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test((r[0] ?? "").trim());
    const amtOk = /^-?\$?[\d,]+\.\d{2}$/.test((r[1] ?? "").trim());
    if (dateOk && amtOk) matches++;
  }
  // La gran mayoría de las filas de muestra deben cumplir el patrón.
  return matches >= Math.ceil(sample.length * 0.7);
}

function parseWellsFargoCSV(rows: string[][], warnings: string[]): CSVParseResult {
  const transactions: ParsedTransaction[] = [];

  for (const r of rows) {
    if (r.length < 5) continue;
    const rawDate = (r[0] ?? "").trim();
    const rawAmt = (r[1] ?? "").trim();
    const description = (r[4] ?? "").trim();
    if (!rawDate || !rawAmt || !description) continue;

    const date = parseLocaleDate(rawDate, "mdy"); // EE. UU. → MM/DD/YYYY
    const signed = parseFloat(rawAmt.replace(/[$,\s]/g, ""));
    if (!signed || Number.isNaN(signed)) continue;

    const amount = Math.abs(signed);
    const isCredit = signed > 0; // positivo = depósito/adición
    const type = inferType(description, amount, isCredit);
    const category = inferCategory(description, type);

    transactions.push({
      date,
      description: description.slice(0, 200),
      amount,
      type,
      category,
      currency: "USD",
      rawLine: r.join(","),
    });
  }

  if (transactions.length === 0) {
    warnings.push("No se encontraron transacciones en el CSV de Wells Fargo.");
  }

  return {
    bank: "wells_fargo",
    bankLabel: "Wells Fargo",
    transactions,
    finalBalance: 0, // El CSV de WF no incluye saldo; el usuario lo ajusta.
    currency: "USD",
    confidence: transactions.length > 0 ? 0.88 : 0,
    warnings,
    accountMeta: {},
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
