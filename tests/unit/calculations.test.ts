import { describe, it, expect } from "vitest";
import {
  calculateNetWorth,
  calculateCardUtilization,
  calculateAggregateCardUtilization,
  calculatePortfolioSummary,
  calculateBudgetRatio,
  calculateInvestmentGain,
  calculateGoalProgress,
  buildAllocationData,
} from "@/lib/calculations";
import type { Account, CreditCard, Investment, Budget } from "@/types/finance";

// ── Helpers para construir entidades mínimas válidas ──────────────────────────
function account(balance: number, type: Account["type"] = "checking"): Account {
  return { id: "a", name: "Cuenta", institution: "Banco", type, balance, currency: "MXN", lastUpdated: "2026-01-01", color: "#000" };
}
function card(balance: number, limit: number): CreditCard {
  return { id: "c", name: "Tarjeta", institution: "Banco", lastFourDigits: "0000", balance, limit, currency: "MXN", cutoffDay: 1, paymentDueDay: 20, minimumPayment: 0, color: "#000" };
}
function investment(quantity: number, purchasePrice: number, currentPrice: number, type: Investment["type"] = "etf"): Investment {
  return { id: "i", name: "Inv", type, quantity, purchasePrice, currentPrice, currency: "MXN", institution: "GBM" };
}
function budget(allocated: number, spent: number): Budget {
  return { id: "b", category: "food", label: "Comida", allocated, spent, currency: "MXN", color: "#000", icon: "x" };
}

describe("calculateNetWorth", () => {
  it("suma cuentas + valor actual de inversiones y resta saldo de tarjetas", () => {
    const r = calculateNetWorth(
      [account(1000), account(500)],
      [card(300, 1000)],
      [investment(10, 5, 8)] // valor actual = 10*8 = 80
    );
    expect(r.totalAssets).toBe(1580);
    expect(r.totalLiabilities).toBe(300);
    expect(r.netWorth).toBe(1280);
  });

  it("maneja arreglos vacíos sin romper (todo en cero)", () => {
    const r = calculateNetWorth([], [], []);
    expect(r.totalAssets).toBe(0);
    expect(r.totalLiabilities).toBe(0);
    expect(r.netWorth).toBe(0);
  });

  it("permite net worth negativo cuando la deuda supera los activos", () => {
    const r = calculateNetWorth([account(100)], [card(500, 1000)], []);
    expect(r.netWorth).toBe(-400);
  });
});

describe("calculateCardUtilization", () => {
  it("devuelve balance/limit", () => {
    expect(calculateCardUtilization(card(300, 1000))).toBeCloseTo(0.3);
  });
  it("evita división por cero cuando el límite es 0", () => {
    expect(calculateCardUtilization(card(300, 0))).toBe(0);
  });
});

describe("calculateAggregateCardUtilization", () => {
  it("suma balances y límites de todas las tarjetas", () => {
    expect(calculateAggregateCardUtilization([card(300, 1000), card(200, 1000)])).toBeCloseTo(0.25);
  });
  it("devuelve 0 sin tarjetas", () => {
    expect(calculateAggregateCardUtilization([])).toBe(0);
  });
});

describe("calculatePortfolioSummary", () => {
  it("calcula valor, ganancia, costo base y % de ganancia", () => {
    const r = calculatePortfolioSummary([investment(10, 5, 8), investment(2, 100, 90)]);
    // inv1: valor 80, costo 50, gan +30 | inv2: valor 180, costo 200, gan -20
    expect(r.totalValue).toBe(260);
    expect(r.totalGain).toBe(10);
    expect(r.costBasis).toBe(250);
    expect(r.totalGainPercent).toBeCloseTo(10 / 250);
  });
  it("portafolio vacío → todo en cero, sin NaN", () => {
    const r = calculatePortfolioSummary([]);
    expect(r.totalValue).toBe(0);
    expect(r.totalGainPercent).toBe(0);
  });
});

describe("calculateBudgetRatio", () => {
  it("devuelve spent/allocated", () => {
    expect(calculateBudgetRatio(budget(1000, 250))).toBeCloseTo(0.25);
  });
  it("evita división por cero con allocated 0", () => {
    expect(calculateBudgetRatio(budget(0, 250))).toBe(0);
  });
});

describe("calculateInvestmentGain", () => {
  it("calcula ganancia absoluta y porcentual", () => {
    const r = calculateInvestmentGain(investment(10, 5, 8));
    expect(r.absoluteGain).toBe(30);
    expect(r.percentageGain).toBeCloseTo(30 / 50);
  });
  it("precio de compra 0 → porcentaje 0 (sin Infinity)", () => {
    const r = calculateInvestmentGain(investment(10, 0, 8));
    expect(r.percentageGain).toBe(0);
  });
});

describe("calculateGoalProgress", () => {
  it("devuelve la fracción de avance", () => {
    expect(calculateGoalProgress(250, 1000)).toBeCloseTo(0.25);
  });
  it("se topa en 1 (100%) aunque se exceda la meta", () => {
    expect(calculateGoalProgress(1500, 1000)).toBe(1);
  });
  it("meta 0 → 0 (sin Infinity)", () => {
    expect(calculateGoalProgress(100, 0)).toBe(0);
  });
});

describe("buildAllocationData", () => {
  it("agrupa por tipo y suma valor actual", () => {
    const data = buildAllocationData([
      { type: "etf", quantity: 10, currentPrice: 8 },
      { type: "etf", quantity: 5, currentPrice: 8 },
      { type: "crypto", quantity: 1, currentPrice: 100 },
    ]);
    const etf = data.find((d) => d.type === "etf");
    const crypto = data.find((d) => d.type === "crypto");
    expect(etf?.value).toBe(120);
    expect(crypto?.value).toBe(100);
    expect(etf?.label).toBe("ETFs");
  });
  it("tipo desconocido recibe label y color de fallback", () => {
    const [d] = buildAllocationData([{ type: "rareza", quantity: 1, currentPrice: 10 }]);
    expect(d.label).toBe("rareza");
    expect(d.color).toBe("#94a3b8");
  });
});
