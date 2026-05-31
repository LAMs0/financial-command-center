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
import { parseStatement, parsePDFStatement } from "@/lib/import";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const SUPPORTED_EXTENSIONS = ["csv", "ofx", "qfx", "txt", "pdf"];

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

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "Unsupported format. Upload a CSV, OFX, QFX or PDF file." },
      { status: 415 }
    );
  }

  try {
    if (ext === "pdf") {
      // PDF: leer como ArrayBuffer y convertir a Buffer de Node.js
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await parsePDFStatement(buffer, file.name);
      return NextResponse.json(parsed);
    }

    // CSV / OFX / QFX / TXT: leer como texto
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
