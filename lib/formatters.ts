import type { Currency } from "@/types/finance";

/*
  formatters.ts — Funciones de presentación de datos
  ────────────────────────────────────────────────────
  Regla de oro: NUNCA formatees dinero directamente en un componente.
  Siempre usa estas funciones. Así si cambias el formato (ej: agregar
  símbolo de moneda distinto), lo cambias en un solo lugar.
*/

/**
 * Formatea un número como moneda.
 * Usa la API nativa de JS (Intl.NumberFormat) — sin librerías externas.
 *
 * Ejemplos:
 *   formatCurrency(28450.75, "MXN") → "$28,450.75"
 *   formatCurrency(1234, "USD")     → "$1,234.00"
 */
export function formatCurrency(
  amount: number,
  currency: Currency = "MXN"
): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número como porcentaje.
 * Ejemplos:
 *   formatPercent(0.217) → "21.7%"
 *   formatPercent(1.0)   → "100.0%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formatea una fecha ISO a formato legible en español.
 * Ejemplo: "2025-05-27" → "27 may 2025"
 */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

/**
 * Formatea número compacto para espacios reducidos.
 * Ejemplos:
 *   formatCompact(52300, "MXN")   → "$52.3 K"
 *   formatCompact(1200000, "MXN") → "$1.2 M"
 *
 * ⚠️  NO usa Intl notation:"compact" porque produce resultados distintos
 * entre el servidor (Node/Linux) y el cliente (browser/Windows), causando
 * un hydration mismatch en React. Esta implementación manual es
 * determinística en cualquier entorno.
 */
export function formatCompact(
  amount: number,
  currency: Currency = "MXN"
): string {
  // Símbolo fijo por moneda — evita que Intl decida el formato
  const symbols: Record<Currency, string> = {
    MXN: "$",
    USD: "US$",
    EUR: "€",
  };
  const symbol = symbols[currency];
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)} M`;
  }
  if (abs >= 1_000) {
    return `${sign}${symbol}${(abs / 1_000).toFixed(1)} K`;
  }
  // Para montos pequeños usa el formato completo — no necesita compresión
  return formatCurrency(amount, currency);
}
