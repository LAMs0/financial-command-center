/*
  locale.ts — Reglas de región: moneda y formato de fecha por banco
  ──────────────────────────────────────────────────────────────────
  El bug más sutil al importar de varios países es el formato de fecha:
  - México / Europa: DD/MM/YYYY  → "05/01/2025" = 5 de enero
  - Estados Unidos:  MM/DD/YYYY  → "05/01/2025" = 1 de mayo  (¡distinto!)

  En lugar de adivinar, atamos el formato (y la moneda por defecto) al
  banco detectado. Una sola fuente de verdad que usan tanto el parser
  CSV como el de PDF/OCR.
*/

import type { Currency } from "@/types/finance";
import type { DetectedBank } from "./types";

export type DateOrder = "dmy" | "mdy";

export interface BankLocale {
  currency: Currency;
  dateOrder: DateOrder;
}

// Por defecto asumimos México (origen histórico del proyecto). Cada banco
// de EE. UU. sobreescribe a USD + MM/DD.
const MX: BankLocale = { currency: "MXN", dateOrder: "dmy" };
const US: BankLocale = { currency: "USD", dateOrder: "mdy" };

export const BANK_LOCALE: Record<DetectedBank, BankLocale> = {
  // México
  bbva_mx: MX,
  santander_mx: MX,
  nu_mx: MX,
  banamex: MX,
  hsbc_mx: MX,
  banorte_mx: MX,
  scotiabank_mx: MX,
  // Estados Unidos
  chase: US,
  bofa: US,
  wells_fargo: US,
  citi_us: US,
  capital_one: US,
  amex_us: US,
  discover: US,
  us_bank: US,
  pnc: US,
  ally: US,
  // Desconocido: se resuelve por heurística (ver resolveLocale)
  generic: MX,
};

/**
 * Resuelve el locale final. Si el banco es genérico, intentamos inferir
 * por señales del texto (símbolo de moneda, palabras "USD"/"MXN", nombres
 * de bancos US, formato de fecha con día > 12).
 */
export function resolveLocale(
  bank: DetectedBank,
  sampleText: string
): BankLocale {
  if (bank !== "generic") return BANK_LOCALE[bank];

  const t = sampleText.toLowerCase();

  // Señales explícitas de moneda
  if (/\bmxn\b|\bpesos?\b|m\.n\.|moneda nacional/.test(t)) return MX;
  if (/\busd\b|\bdollars?\b|u\.s\. dollar/.test(t)) return US;

  // Señales de bancos de EE. UU. en texto libre
  if (/\b(chase|bank of america|wells fargo|citibank|capital one|u\.s\. bank|pnc|ally|navy federal|discover|truist)\b/.test(t)) {
    return US;
  }

  // Señales de México
  if (/\b(bbva|banamex|banorte|scotiabank|santander|clabe|spei|rfc)\b/.test(t)) {
    return MX;
  }

  // Heurística de fecha: si vemos una fecha cuyo primer número > 12,
  // entonces ese campo es el DÍA → formato DD/MM (México/Europa).
  const dm = sampleText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-]\d{2,4}\b/);
  if (dm) {
    const first = parseInt(dm[1], 10);
    const second = parseInt(dm[2], 10);
    if (first > 12 && second <= 12) return MX;  // 25/01 → DD/MM
    if (second > 12 && first <= 12) return US;  // 01/25 → MM/DD
  }

  return MX; // último recurso
}

/**
 * Parsea una fecha respetando el orden (dmy/mdy) para los formatos
 * numéricos ambiguos. Los formatos no ambiguos (ISO, mes en texto) se
 * resuelven igual sin importar el orden.
 */
export function parseLocaleDate(raw: string, order: DateOrder): string {
  const s = raw.trim();

  // ISO YYYY-MM-DD — no ambiguo
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Mes en texto (es/en) — no ambiguo
  const MONTHS: Record<string, string> = {
    ene: "01", enero: "01", jan: "01", january: "01",
    feb: "02", febrero: "02", february: "02",
    mar: "03", marzo: "03", march: "03",
    abr: "04", abril: "04", apr: "04", april: "04",
    may: "05", mayo: "05",
    jun: "06", junio: "06", june: "06",
    jul: "07", julio: "07", july: "07",
    ago: "08", agosto: "08", aug: "08", august: "08",
    sep: "09", septiembre: "09", sept: "09", september: "09",
    oct: "10", octubre: "10", october: "10",
    nov: "11", noviembre: "11", november: "11",
    dic: "12", diciembre: "12", dec: "12", december: "12",
  };

  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // "05-ene-2025", "Jan 5, 2025", "5 January 2025"
  const textMonth1 = s.match(/^(\d{1,2})[-\s]([a-záéíóú]+)[-\s.,]*(\d{2,4})$/i);
  if (textMonth1) {
    const [, day, monStr, yr] = textMonth1;
    const month = MONTHS[norm(monStr).slice(0, 4)] ?? MONTHS[norm(monStr).slice(0, 3)] ?? "01";
    const year = yr.length === 2 ? `20${yr}` : yr;
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }
  // "Jan 5, 2025" / "January 5 2025"
  const textMonth2 = s.match(/^([a-záéíóú]+)[-\s.]+(\d{1,2})[-\s.,]+(\d{2,4})$/i);
  if (textMonth2) {
    const [, monStr, day, yr] = textMonth2;
    const month = MONTHS[norm(monStr).slice(0, 4)] ?? MONTHS[norm(monStr).slice(0, 3)];
    if (month) {
      const year = yr.length === 2 ? `20${yr}` : yr;
      return `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }

  // Numérico DD/MM/YYYY o MM/DD/YYYY (ambiguo → usar `order`)
  const num = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (num) {
    const [, a, b, y] = num;
    const year = y.length === 2 ? `20${y}` : y;
    let day: string, month: string;
    if (order === "mdy") { month = a; day = b; }
    else { day = a; month = b; }
    // Salvaguarda: si el "mes" resultante > 12 pero el otro campo es válido,
    // invertimos (protege contra estados que mezclan formatos).
    if (parseInt(month, 10) > 12 && parseInt(day, 10) <= 12) {
      [day, month] = [month, day];
    }
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}
