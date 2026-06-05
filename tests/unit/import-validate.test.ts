import { describe, it, expect } from "vitest";
import { sanitizeImportPayload, MAX_TRANSACTIONS } from "@/lib/import/validate";

// Regex de caracteres de control C0 (U+0000–U+001F) y DEL (U+007F), construido
// con strings escapados para NO embeber bytes de control en el fuente.
const CONTROL = new RegExp("[\\x00-\\x1F\\x7F]");

describe("sanitizeImportPayload — robustez ante entrada no confiable", () => {
  it("entrada vacía/indefinida produce un payload válido con defaults", () => {
    const p = sanitizeImportPayload(undefined);
    expect(p.account.name).toBe("Cuenta importada");
    expect(p.transactions).toEqual([]);
    expect(p.goals).toEqual([]);
  });

  it("descarta transacciones con fecha inválida", () => {
    const p = sanitizeImportPayload({
      transactions: [
        { date: "no-es-fecha", amount: 100, type: "expense" },
        { date: "2026-02-30", amount: 100, type: "expense" }, // 30 feb no existe
        { date: "2026-01-15", amount: 100, type: "expense" }, // válida
      ],
    });
    expect(p.transactions).toHaveLength(1);
    expect(p.transactions[0].date).toBe("2026-01-15");
  });

  it("descarta transacciones con monto 0", () => {
    const p = sanitizeImportPayload({
      transactions: [{ date: "2026-01-15", amount: 0, type: "expense" }],
    });
    expect(p.transactions).toHaveLength(0);
  });

  it("clampa montos negativos a >= 0 y rechaza NaN/Infinity", () => {
    const p = sanitizeImportPayload({
      transactions: [
        { date: "2026-01-15", amount: -50, type: "expense" },
        { date: "2026-01-16", amount: Infinity, type: "expense" },
        { date: "2026-01-17", amount: "abc", type: "expense" },
      ],
    });
    // -50 → 0 (descartada), Infinity → 0 (descartada), "abc" → 0 (descartada)
    expect(p.transactions).toHaveLength(0);
  });

  it("cae a 'expense' / 'MXN' ante enums inválidos", () => {
    const p = sanitizeImportPayload({
      transactions: [{ date: "2026-01-15", amount: 10, type: "hackeo", currency: "BTC" }],
    });
    expect(p.transactions[0].type).toBe("expense");
    expect(p.transactions[0].currency).toBe("MXN");
  });

  it("acota el número de transacciones al máximo permitido", () => {
    const many = Array.from({ length: MAX_TRANSACTIONS + 500 }, (_, i) => ({
      date: "2026-01-15",
      amount: 10 + i,
      type: "expense",
    }));
    const p = sanitizeImportPayload({ transactions: many });
    expect(p.transactions.length).toBeLessThanOrEqual(MAX_TRANSACTIONS);
  });

  it("transactions no-arreglo → []", () => {
    expect(sanitizeImportPayload({ transactions: "boom" }).transactions).toEqual([]);
  });

  it("elimina caracteres de control de las descripciones", () => {
    // "Pago" + BEL (U+0007) + " luz" — el carácter de control debe desaparecer.
    const dirty = "Pago" + String.fromCharCode(7) + " luz";
    const p = sanitizeImportPayload({
      transactions: [{ date: "2026-01-15", amount: 10, type: "expense", description: dirty }],
    });
    const clean = p.transactions[0].description;
    expect(CONTROL.test(clean)).toBe(false);
    expect(clean).toContain("Pago");
    expect(clean).toContain("luz");
  });

  it("normaliza lastFourDigits a 4 dígitos", () => {
    const p = sanitizeImportPayload({ account: { lastFourDigits: "tarjeta-1234-5678" } });
    expect(p.account.lastFourDigits).toBe("5678");
  });
});
