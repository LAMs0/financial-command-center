/*
  parsers/image.ts — Lectura de estados de cuenta como IMAGEN
  ─────────────────────────────────────────────────────────────
  Cuando el usuario sube una foto o captura de pantalla de su estado
  de cuenta (jpg, png, webp, heic...), no hay texto: hay píxeles.
  Aplicamos OCR para reconstruir el texto y luego reusamos exactamente
  la misma lógica de extracción de transacciones del parser de PDF.
*/

import type { Buffer } from "node:buffer";
import { ocrSingleImage } from "./ocr";
import { buildPDFResult, type PDFParseResult } from "./pdf";

export async function parseImage(buffer: Buffer): Promise<PDFParseResult> {
  let text = "";
  try {
    text = await ocrSingleImage(buffer);
  } catch (err) {
    console.warn("[parseImage] OCR falló:", (err as Error)?.message);
  }

  if (!text || text.trim().length < 20) {
    return {
      bank: "generic",
      bankLabel: "No detectado",
      transactions: [],
      finalBalance: 0,
      currency: "MXN",
      confidence: 0,
      warnings: [
        "No se pudo leer texto de la imagen. Asegúrate de que la foto esté nítida, " +
        "bien iluminada y derecha. Si puedes, exporta el CSV desde tu banca en línea.",
      ],
      accountMeta: {},
    };
  }

  const result = buildPDFResult(text, 1, [
    "Imagen leída con OCR. Revisa montos y fechas antes de importar.",
  ]);
  // El OCR de fotos es el origen menos confiable.
  result.confidence = Math.min(result.confidence, 0.5);
  return result;
}
