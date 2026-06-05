import { describe, it, expect } from "vitest";
import { mockProvider } from "@/lib/banking/mock-provider";

describe("mockProvider", () => {
  it("expone su id como 'mock'", () => {
    expect(mockProvider.id).toBe("mock");
  });

  it("lista instituciones con campos completos", async () => {
    const insts = await mockProvider.listInstitutions();
    expect(insts.length).toBeGreaterThan(0);
    for (const i of insts) {
      expect(i.id).toBeTruthy();
      expect(i.name).toBeTruthy();
      expect(i.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(["MX", "US"]).toContain(i.country);
    }
  });

  it("sync devuelve cuentas y transacciones de la institución", async () => {
    const insts = await mockProvider.listInstitutions();
    const target = insts[0];
    const res = await mockProvider.sync(target.id);

    expect(res.institution.id).toBe(target.id);
    expect(res.accounts.length).toBeGreaterThan(0);
    expect(res.transactions.length).toBeGreaterThan(0);
  });

  it("toda transacción apunta a una cuenta existente del resultado", async () => {
    const res = await mockProvider.sync("ins_us_wellsfargo");
    const accountIds = new Set(res.accounts.map((a) => a.externalId));
    for (const t of res.transactions) {
      expect(accountIds.has(t.accountExternalId)).toBe(true);
      expect(t.amount).toBeGreaterThan(0); // montos siempre positivos
      expect(["income", "expense", "transfer"]).toContain(t.type);
    }
  });

  it("las cuentas tienen moneda y tipo válidos", async () => {
    const res = await mockProvider.sync("ins_mx_bbva");
    for (const a of res.accounts) {
      expect(["MXN", "USD", "EUR"]).toContain(a.currency);
      expect(["checking", "savings", "cash", "investment"]).toContain(a.type);
      expect(Number.isFinite(a.balance)).toBe(true);
    }
  });

  it("lanza error ante una institución desconocida", async () => {
    await expect(mockProvider.sync("ins_inexistente")).rejects.toThrow();
  });
});
