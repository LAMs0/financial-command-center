/*
  parsers/xlsx.ts — Lectura de estados de cuenta en Excel
  ─────────────────────────────────────────────────────────
  Muchos bancos (y los propios usuarios) exportan los movimientos como
  .xlsx / .xls. En lugar de escribir un parser de columnas nuevo,
  convertimos la hoja a un CSV en memoria y reusamos parseCSV, que ya
  sabe detectar bancos, encabezados y mapear columnas.

  Elegimos la hoja con más filas (suele ser la de movimientos, no una
  portada con metadatos).
*/

import type { Buffer } from "node:buffer";

export async function xlsxToCSV(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "buffer" });

  // Elegir la hoja con más contenido.
  let bestCSV = "";
  let bestRows = -1;
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "," });
    const rows = csv.split("\n").filter((l) => l.trim().length > 0).length;
    if (rows > bestRows) {
      bestRows = rows;
      bestCSV = csv;
    }
  }
  return bestCSV;
}
