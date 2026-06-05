import { describe, it, expect } from "vitest";
import {
  formatPercent,
  formatCompact,
  formatAccountType,
  transactionTone,
  transactionPrefix,
  formatCurrency,
} from "@/lib/formatters";

describe("formatPercent", () => {
  it("convierte fracción a porcentaje con 1 decimal por defecto", () => {
    expect(formatPercent(0.217)).toBe("21.7%");
    expect(formatPercent(1)).toBe("100.0%");
  });
  it("respeta el número de decimales", () => {
    expect(formatPercent(0.3, 0)).toBe("30%");
  });
});

describe("formatCompact", () => {
  it("comprime miles con sufijo K", () => {
    expect(formatCompact(52300, "MXN")).toBe("$52.3 K");
  });
  it("comprime millones con sufijo M", () => {
    expect(formatCompact(1_200_000, "MXN")).toBe("$1.2 M");
  });
  it("usa el símbolo correcto por moneda", () => {
    expect(formatCompact(1000, "USD")).toBe("US$1.0 K");
    expect(formatCompact(1000, "EUR")).toBe("€1.0 K");
  });
  it("conserva el signo en negativos", () => {
    expect(formatCompact(-1500, "MXN")).toBe("-$1.5 K");
  });
  it("monto pequeño cae al formato de moneda completo", () => {
    expect(formatCompact(500, "MXN")).toBe(formatCurrency(500, "MXN"));
  });
});

describe("formatAccountType", () => {
  it("mapea cada tipo a su etiqueta", () => {
    expect(formatAccountType("checking")).toBe("Checking");
    expect(formatAccountType("savings")).toBe("Savings");
    expect(formatAccountType("cash")).toBe("Cash");
    expect(formatAccountType("investment")).toBe("Investment");
  });
});

describe("transactionTone / transactionPrefix", () => {
  it("ingreso es positivo y con prefijo +", () => {
    expect(transactionTone("income")).toContain("positive");
    expect(transactionPrefix("income")).toBe("+");
  });
  it("gasto es negativo y con prefijo -", () => {
    expect(transactionTone("expense")).toContain("negative");
    expect(transactionPrefix("expense")).toBe("-");
  });
  it("transferencia es info y con prefijo +", () => {
    expect(transactionTone("transfer")).toContain("info");
    expect(transactionPrefix("transfer")).toBe("+");
  });
});

describe("formatCurrency", () => {
  it("incluye separador de miles y 2 decimales", () => {
    // No fijamos el locale exacto (depende del entorno), pero sí los dígitos.
    const out = formatCurrency(28450.75, "MXN");
    expect(out).toMatch(/28[,.]450[.,]75/);
  });
});
