import type {
  Account,
  AllocationDatum,
  Budget,
  CreditCard,
  Investment,
  NetWorthSummary,
} from "@/types/finance";

export type { AllocationDatum };

/*
  calculations.ts — Lógica de negocio financiera
  ────────────────────────────────────────────────
  Estas funciones toman datos crudos y devuelven resúmenes calculados.
  Son funciones puras: misma entrada → misma salida, sin efectos secundarios.
  Fáciles de testear unitariamente cuando llegue ese momento.
*/

/**
 * Calcula el Net Worth completo.
 * Assets: cuentas bancarias + valor actual de inversiones
 * Liabilities: saldo de tarjetas de crédito
 */
export function calculateNetWorth(
  accounts: Account[],
  cards: CreditCard[],
  investments: Investment[]
): NetWorthSummary {
  const bankAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // Valor actual de cada inversión = cantidad × precio actual
  const investmentAssets = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.currentPrice,
    0
  );

  const totalAssets = bankAssets + investmentAssets;
  const totalLiabilities = cards.reduce((sum, card) => sum + card.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Mock de tendencia: en producción esto vendría de datos históricos
  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    currency: "MXN",
    trend: "up",
    trendPercentage: 0.034, // +3.4% vs mes anterior (mock)
  };
}

/**
 * Calcula el porcentaje de utilización de una tarjeta de crédito.
 * Sobre 30% = warning. Sobre 70% = danger.
 */
export function calculateCardUtilization(card: CreditCard): number {
  if (card.limit === 0) return 0;
  return card.balance / card.limit;
}

/**
 * Calcula la utilización agregada de todas las tarjetas de crédito.
 */
export function calculateAggregateCardUtilization(cards: CreditCard[]): number {
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  return totalLimit === 0 ? 0 : totalBalance / totalLimit;
}

/**
 * Calcula el resumen del portafolio de inversiones.
 */
export function calculatePortfolioSummary(investments: Investment[]): {
  totalValue: number;
  totalGain: number;
  costBasis: number;
  totalGainPercent: number;
} {
  let totalValue = 0;
  let totalGain = 0;
  for (const inv of investments) {
    const currentValue = inv.quantity * inv.currentPrice;
    const purchaseValue = inv.quantity * inv.purchasePrice;
    totalValue += currentValue;
    totalGain += currentValue - purchaseValue;
  }
  const costBasis = totalValue - totalGain;
  return {
    totalValue,
    totalGain,
    costBasis,
    totalGainPercent: costBasis === 0 ? 0 : totalGain / costBasis,
  };
}

/**
 * Calcula el ratio de gasto de un presupuesto (spent / allocated).
 */
export function calculateBudgetRatio(budget: Budget): number {
  return budget.allocated === 0 ? 0 : budget.spent / budget.allocated;
}

/**
 * Calcula la ganancia/pérdida de una inversión en valor absoluto y porcentaje.
 */
export function calculateInvestmentGain(investment: Investment): {
  absoluteGain: number;
  percentageGain: number;
} {
  const currentValue = investment.quantity * investment.currentPrice;
  const purchaseValue = investment.quantity * investment.purchasePrice;
  const absoluteGain = currentValue - purchaseValue;
  const percentageGain =
    purchaseValue === 0 ? 0 : absoluteGain / purchaseValue;

  return { absoluteGain, percentageGain };
}

/**
 * Calcula el progreso de una meta como número entre 0 y 1.
 */
export function calculateGoalProgress(
  currentAmount: number,
  targetAmount: number
): number {
  if (targetAmount === 0) return 0;
  return Math.min(currentAmount / targetAmount, 1); // Máximo 1 (100%)
}

/*
  Metadatos de tipos de activo para el PortfolioAllocationChart.
  Vivir aquí (server-safe) en lugar del componente client permite
  que los Server Components puedan calcular los datos antes de pasarlos.
*/
const ASSET_TYPE_META: Record<string, { label: string; color: string }> = {
  etf:    { label: "ETFs",    color: "#10b981" },
  stock:  { label: "Stocks",  color: "#3b82f6" },
  crypto: { label: "Crypto",  color: "#f59e0b" },
  bond:   { label: "Bonds",   color: "#8b5cf6" },
  fund:   { label: "Funds",   color: "#14b8a6" },
};

/**
 * Agrupa las inversiones por tipo y devuelve datos listos para un donut chart.
 * Función pura — segura en Server Components.
 */
export function buildAllocationData(
  investments: { type: string; quantity: number; currentPrice: number }[]
): AllocationDatum[] {
  const byType: Record<string, number> = {};

  for (const inv of investments) {
    byType[inv.type] = (byType[inv.type] ?? 0) + inv.quantity * inv.currentPrice;
  }

  return Object.entries(byType).map(([type, value]) => ({
    type,
    label: ASSET_TYPE_META[type]?.label ?? type,
    value,
    color: ASSET_TYPE_META[type]?.color ?? "#94a3b8",
  }));
}
