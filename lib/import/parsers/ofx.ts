/*
  parsers/ofx.ts — Parser de archivos OFX / QFX (Open Financial Exchange)
  ────────────────────────────────────────────────────────────────────────
  OFX es un formato estándar exportado por muchos bancos (Banamex, HSBC,
  algunos módulos de BBVA en línea). Es un formato SGML/XML híbrido:
  - La versión antigua (1.x) usa tags sin cierre: <TAG>valor<TAG2>valor2
  - La versión nueva (2.x) es XML bien formado

  Parseamos ambas versiones con un extractor de tags simple.
*/

import type { Currency } from "@/types/finance";
import type { ParsedTransaction } from "../types";
import { inferCategory, inferType } from "../categorize";

// ── Extractor de valor de tag OFX ──────────────────────────────────────────

function getTagValue(content: string, tag: string): string {
  // Versión XML: <TAG>valor</TAG>
  const xmlMatch = content.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
  if (xmlMatch) return xmlMatch[1].trim();

  // Versión SGML: <TAG>valor\n (sin cierre)
  const sgmlMatch = content.match(new RegExp(`<${tag}>([^\r\n<]*)`, "i"));
  if (sgmlMatch) return sgmlMatch[1].trim();

  return "";
}

/** Extrae todos los bloques entre <TAG> y </TAG> */
function getTagBlocks(content: string, tag: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[0]);
  }

  // Fallback para SGML sin cierre: buscar entre <TAG> y el siguiente <TAG>
  if (blocks.length === 0) {
    const sgmlRegex = new RegExp(`<${tag}>([\\s\\S]*?)(?=<${tag}>|$)`, "gi");
    while ((match = sgmlRegex.exec(content)) !== null) {
      blocks.push(match[0]);
    }
  }

  return blocks;
}

// ── Parser de fechas OFX ───────────────────────────────────────────────────

/** OFX usa YYYYMMDD o YYYYMMDDHHmmss[zona] */
function parseOFXDate(raw: string): string {
  const s = raw.replace(/\[.*\]/, "").trim(); // quitar zona horaria
  if (s.length >= 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return new Date().toISOString().slice(0, 10);
}

// ── Resultado ──────────────────────────────────────────────────────────────

export interface OFXParseResult {
  transactions: ParsedTransaction[];
  finalBalance: number;
  currency: Currency;
  accountType: "checking" | "savings" | "credit_card";
  institution: string;
  accountId: string;
  warnings: string[];
}

export function parseOFX(rawContent: string): OFXParseResult {
  const warnings: string[] = [];
  const content = rawContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // ── Información de la cuenta ─────────────────────────────────────────────
  const institution = getTagValue(content, "ORG") || getTagValue(content, "FID") || "Banco";
  const accountId = getTagValue(content, "ACCTID") || "";
  const currency = (getTagValue(content, "CURDEF") || "MXN") as Currency;

  // Determinar si es cuenta de crédito o débito
  const hasCCStmt = content.toUpperCase().includes("<CCSTMTTRNRS>") || content.toUpperCase().includes("<CCSTMT>");
  let accountType: OFXParseResult["accountType"] = "checking";
  if (hasCCStmt) {
    accountType = "credit_card";
  } else {
    const acctType = getTagValue(content, "ACCTTYPE").toLowerCase();
    if (acctType.includes("saving") || acctType.includes("ahorro")) {
      accountType = "savings";
    }
  }

  // ── Saldo final ───────────────────────────────────────────────────────────
  const balAmtRaw = getTagValue(content, "BALAMT") || getTagValue(content, "LEDGERBAL");
  const finalBalance = parseFloat(balAmtRaw.replace(/,/g, "")) || 0;

  // ── Transacciones ─────────────────────────────────────────────────────────
  const txBlocks = getTagBlocks(content, "STMTTRN");
  const transactions: ParsedTransaction[] = [];

  for (const block of txBlocks) {
    const trnType = getTagValue(block, "TRNTYPE").toUpperCase();
    const dateRaw = getTagValue(block, "DTPOSTED") || getTagValue(block, "DTUSER");
    const amtRaw = getTagValue(block, "TRNAMT");
    const name = getTagValue(block, "NAME") || getTagValue(block, "MEMO") || "Sin descripción";
    const memo = getTagValue(block, "MEMO");
    const description = [name, memo].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" — ");

    const date = parseOFXDate(dateRaw);
    const rawAmount = parseFloat(amtRaw.replace(/,/g, "")) || 0;
    const amount = Math.abs(rawAmount);
    if (amount === 0) continue;

    /*
      En OFX, el signo del monto indica dirección desde la perspectiva del banco:
      - DEBIT / monto negativo → cargo (gasto del cliente)
      - CREDIT / monto positivo → abono (ingreso del cliente)
      Para tarjetas de crédito, la lógica se invierte en algunas instituciones.
    */
    const isCredit = rawAmount > 0 ||
      trnType === "CREDIT" ||
      trnType === "INT" ||    // Interés
      trnType === "DIVIDEND";

    const type = inferType(description, amount, isCredit);
    const category = inferCategory(description, type);

    transactions.push({
      date,
      description: description.trim(),
      amount,
      type,
      category,
      currency,
      rawLine: block.slice(0, 120),
    });
  }

  if (transactions.length === 0) {
    warnings.push("No se encontraron transacciones en el archivo OFX.");
  }

  return {
    transactions,
    finalBalance,
    currency,
    accountType,
    institution,
    accountId,
    warnings,
  };
}
