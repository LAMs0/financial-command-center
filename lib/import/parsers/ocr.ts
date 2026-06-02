/*
  parsers/ocr.ts — Reconocimiento óptico de caracteres (OCR)
  ────────────────────────────────────────────────────────────
  Cuando un PDF es un escaneo (imagen sin capa de texto) o el usuario
  sube directamente una FOTO / IMAGEN de su estado de cuenta, no hay
  texto seleccionable que extraer. La solución es "leer" la imagen con
  OCR y reconstruir el texto.

  Pipeline:
  1. PDF escaneado → rasterizamos cada página a PNG con pdf-parse
     (getScreenshot usa pdf.js + canvas internamente).
  2. Imagen suelta (jpg/png/webp...) → la normalizamos con sharp.
  3. Tesseract.js lee cada imagen y devuelve texto plano.

  ¿Por qué español + inglés? Los extractos mexicanos mezclan ambos
  ("FECHA", "DESCRIPCION", pero también "DEPOSIT", nombres de comercios).

  Nota de rendimiento: el OCR es LENTO (segundos por página). Por eso
  solo se usa como FALLBACK cuando la extracción de texto normal falla.
*/

import type { Buffer } from "node:buffer";

// Cargamos tesseract.js de forma perezosa para que nunca entre al bundle
// del cliente ni penalice el arranque del servidor si no se usa OCR.
let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const path = await import("node:path");

      // Modelos OCR empaquetados en el repo (carpeta /tessdata) en lugar de
      // descargarlos del CDN en runtime. Así funciona sin internet y sin la
      // latencia de la primera descarga. Los archivos son *.traineddata.gz.
      const tessdataDir = path.join(process.cwd(), "tessdata");

      // "spa+eng": modelos de español e inglés combinados.
      return createWorker(["spa", "eng"], 1, {
        langPath: tessdataDir,
        cachePath: tessdataDir,
        gzip: true,
      });
    })();
  }
  return workerPromise;
}

/**
 * Rasteriza un PDF a una imagen PNG por página usando pdf-parse.
 * scale=3 da buena resolución para OCR sin disparar el uso de memoria.
 * Limitamos a `maxPages` para no colgar el servidor con PDFs enormes.
 */
export async function pdfToImageBuffers(
  buffer: Buffer,
  maxPages = 15
): Promise<Buffer[]> {
  const { PDFParse } = await import("pdf-parse");
  const { Buffer: NodeBuffer } = await import("node:buffer");

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const shot = await parser.getScreenshot({ imageBuffer: true, scale: 3 });

  const pages = (shot.pages ?? []).slice(0, maxPages);
  return pages
    .filter((p) => p?.data)
    .map((p) => NodeBuffer.from(p.data as Uint8Array));
}

/**
 * Normaliza una imagen suelta (foto del estado de cuenta) para mejorar
 * la precisión del OCR: escala de grises, mayor contraste, tamaño mínimo.
 */
export async function normalizeImageForOCR(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(buffer)
      .rotate() // respeta orientación EXIF (fotos de celular)
      .grayscale()
      .normalize() // estira el rango de contraste
      .resize({ width: 2000, withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    // Si sharp falla (formato no soportado), devolvemos el buffer tal cual;
    // tesseract intentará leerlo de todas formas.
    return buffer;
  }
}

/** Corre OCR sobre una lista de imágenes y concatena el texto resultante. */
export async function ocrImageBuffers(buffers: Buffer[]): Promise<string> {
  if (buffers.length === 0) return "";
  const worker = await getWorker();

  const texts: string[] = [];
  for (const buf of buffers) {
    const { data } = await worker.recognize(buf);
    if (data.text?.trim()) texts.push(data.text);
  }
  return texts.join("\n");
}

/** OCR de una sola imagen (ya normalizada o no). */
export async function ocrSingleImage(buffer: Buffer): Promise<string> {
  const normalized = await normalizeImageForOCR(buffer);
  return ocrImageBuffers([normalized]);
}

/** OCR de un PDF completo (escaneado): rasteriza y lee cada página. */
export async function ocrPdfBuffer(buffer: Buffer): Promise<string> {
  const images = await pdfToImageBuffers(buffer);
  return ocrImageBuffers(images);
}
