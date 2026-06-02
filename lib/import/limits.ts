/*
  lib/import/limits.ts — Cotas de seguridad para el parseo de extractos.
  ──────────────────────────────────────────────────────────────────────
  Los parsers corren regex sobre texto controlado por el usuario (CSV/OFX,
  capa de texto de un PDF, salida de OCR). Algunas regex (p. ej. la de montos
  `\d{1,3}(?:,\d{3})*\.\d{2}` con flag global) degradan a O(n²) sobre entradas
  adversarias muy largas → posible DoS por CPU.

  Mitigación simple y robusta: acotar la longitud del texto ANTES de parsear.
  Un extracto bancario real, incluso de 50 páginas, rara vez supera ~200 KB de
  texto; 2 MB es un techo muy holgado que aun así corta cualquier payload
  diseñado para ser patológico.
*/

/** Máximo de caracteres que se parsean de un extracto (~2 MB de texto). */
export const MAX_PARSE_TEXT_CHARS = 2_000_000;

/**
 * Acota el texto a `MAX_PARSE_TEXT_CHARS`. Si lo trunca, añade un aviso al
 * arreglo `warnings` (si se proporciona) para que la UI lo muestre.
 */
export function capParseText(text: string, warnings?: string[]): string {
  if (text.length <= MAX_PARSE_TEXT_CHARS) return text;
  warnings?.push(
    `El archivo es muy grande; se procesaron los primeros ${Math.round(
      MAX_PARSE_TEXT_CHARS / 1_000_000
    )} MB de texto. Si faltan movimientos, divide el extracto o exporta el CSV.`
  );
  return text.slice(0, MAX_PARSE_TEXT_CHARS);
}
