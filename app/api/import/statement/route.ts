/*
  POST /api/import/statement

  Recibe un extracto bancario (CSV, OFX o PDF), lo parsea y devuelve
  un ParsedStatement listo para la UI de revisión.

  PDFs se leen como ArrayBuffer → Buffer (Node.js) y se procesan con pdf-parse.
  CSV/OFX se leen como texto plano.
  El archivo nunca se guarda en disco — todo en memoria.
  Límite: 10 MB (PDFs pueden ser más grandes que CSVs).
*/

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  parseStatement,
  parsePDFStatement,
  parseImageStatement,
  parseXLSXStatement,
} from "@/lib/import";

// El OCR de imágenes/PDFs escaneados puede tardar varios segundos por página.
export const maxDuration = 120;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB (imágenes/escaneos pesan más)

const TEXT_EXTENSIONS = ["csv", "ofx", "qfx", "txt"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff", "heic", "heif"];
const XLSX_EXTENSIONS = ["xlsx", "xls"];

const SUPPORTED_EXTENSIONS = [
  ...TEXT_EXTENSIONS,
  ...IMAGE_EXTENSIONS,
  ...XLSX_EXTENSIONS,
  "pdf",
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  // Detectar el tipo real por extensión o por MIME (a veces la extensión
  // viene vacía, p. ej. al subir una imagen pegada del portapapeles).
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type || "";
  const isImage = IMAGE_EXTENSIONS.includes(ext) || mime.startsWith("image/");
  const isPDF = ext === "pdf" || mime === "application/pdf";
  const isXLSX = XLSX_EXTENSIONS.includes(ext) ||
    mime.includes("spreadsheetml") || mime === "application/vnd.ms-excel";
  const isText = TEXT_EXTENSIONS.includes(ext);

  if (!SUPPORTED_EXTENSIONS.includes(ext) && !isImage && !isPDF && !isXLSX) {
    return NextResponse.json(
      { error: "Formato no soportado. Sube un CSV, OFX, Excel, PDF o una imagen/foto del estado de cuenta." },
      { status: 415 }
    );
  }

  try {
    if (isPDF) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parsePDFStatement(buffer, file.name);
      return NextResponse.json(parsed);
    }

    if (isImage) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseImageStatement(buffer, file.name);
      return NextResponse.json(parsed);
    }

    if (isXLSX) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseXLSXStatement(buffer, file.name);
      return NextResponse.json(parsed);
    }

    // CSV / OFX / QFX / TXT: leer como texto
    void isText;
    const rawContent = await file.text();
    const parsed = parseStatement(rawContent, file.name);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[import/statement] Parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse the file. Make sure it is a valid bank statement." },
      { status: 422 }
    );
  }
}
