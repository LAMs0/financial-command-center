/*
  finance.ts — Contratos de datos del Financial Command Center
  ─────────────────────────────────────────────────────────────
  Aquí viven TODOS los tipos de la app. Cualquier componente que
  muestre datos financieros importa sus tipos desde aquí.

  Regla de oro: si cambias la forma de un dato, lo cambias aquí
  y TypeScript te dice exactamente qué se rompió en toda la app.
*/

// ─── Primitivos compartidos ────────────────────────────────────────

/** Códigos de moneda ISO 4217 que soportamos */
export type Currency = "MXN" | "USD" | "EUR";

/** Tendencia de un valor respecto al período anterior */
export type Trend = "up" | "down" | "neutral";

// ─── Cuentas bancarias ─────────────────────────────────────────────

export type AccountType =
  | "checking"    // Cuenta corriente / débito
  | "savings"     // Cuenta de ahorro
  | "cash"        // Efectivo
  | "investment"; // Cuenta de inversión

export interface Account {
  id: string;
  name: string;         // "BBVA Débito", "Nu Ahorro"
  institution: string;  // "BBVA", "Nu", "HSBC"
  type: AccountType;
  balance: number;
  currency: Currency;
  lastUpdated: string;  // ISO date string: "2025-05-27"
  color: string;        // Color hex para identificar visualmente la cuenta
}

// ─── Tarjetas de crédito ───────────────────────────────────────────

export interface CreditCard {
  id: string;
  name: string;         // "Amex Gold", "BBVA Azul"
  institution: string;
  lastFourDigits: string;
  balance: number;      // Deuda actual (lo que debes)
  limit: number;        // Límite de crédito total
  currency: Currency;
  cutoffDay: number;    // Día del mes en que corta (ej: 15)
  paymentDueDay: number; // Día límite de pago (ej: 10)
  minimumPayment: number;
  color: string;
}

// ─── Transacciones ─────────────────────────────────────────────────

export type TransactionType = "income" | "expense" | "transfer";

export type TransactionCategory =
  | "salary"
  | "food"
  | "transport"
  | "entertainment"
  | "health"
  | "shopping"
  | "utilities"
  | "housing"
  | "education"
  | "travel"
  | "investment"
  | "transfer"
  | "other";

export interface Transaction {
  id: string;
  description: string;  // "Uber Eats", "Nómina Mayo"
  amount: number;       // Siempre positivo — el tipo indica si es ingreso/gasto
  type: TransactionType;
  category: TransactionCategory;
  date: string;         // ISO date string
  accountId: string;    // Referencia a la cuenta donde ocurrió
  currency: Currency;
  notes?: string;       // Opcional: notas del usuario
}

// ─── Inversiones ───────────────────────────────────────────────────

export type InvestmentType =
  | "stock"    // Acciones individuales
  | "etf"      // Fondos indexados
  | "crypto"   // Criptomonedas
  | "fund"     // Fondos de inversión
  | "bond"     // Bonos
  | "real_estate"; // Bienes raíces

export interface Investment {
  id: string;
  name: string;         // "Apple Inc.", "S&P 500 ETF"
  ticker?: string;      // "AAPL", "VOO" — opcional para fondos sin ticker
  type: InvestmentType;
  quantity: number;     // Número de acciones/unidades
  purchasePrice: number; // Precio promedio de compra por unidad
  currentPrice: number;  // Precio actual por unidad
  currency: Currency;
  institution: string;  // "GBM", "Fidelity", "Bitso"
}

// ─── Metas financieras ─────────────────────────────────────────────

export type GoalCategory =
  | "emergency_fund"  // Fondo de emergencia
  | "vacation"        // Viaje o vacaciones
  | "education"       // Estudios / curso
  | "vehicle"         // Carro / moto
  | "home"            // Casa / depa
  | "retirement"      // Retiro
  | "debt_payoff"     // Pagar deuda
  | "custom";         // Meta personalizada

export interface Goal {
  id: string;
  name: string;           // "Fondo de emergencia", "Viaje a Japón"
  category: GoalCategory;
  targetAmount: number;   // Cuánto quieres llegar
  currentAmount: number;  // Cuánto llevas ahorrado
  currency: Currency;
  targetDate: string;     // Fecha objetivo ISO
  color: string;          // Color de la barra de progreso
  icon: string;           // Emoji para la card: "✈️", "🏠"
}

// ─── Resúmenes calculados ──────────────────────────────────────────
/*
  Estos tipos NO vienen de una API — los calculamos nosotros en
  lib/calculations.ts a partir de los datos anteriores.
  Los separamos para que quede claro qué es dato crudo vs. derivado.
*/

export interface NetWorthSummary {
  totalAssets: number;     // Suma de todo lo que tienes
  totalLiabilities: number; // Suma de todo lo que debes
  netWorth: number;        // totalAssets - totalLiabilities
  currency: Currency;
  trend: Trend;
  trendPercentage: number; // Cambio % vs mes anterior
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;         // totalIncome - totalExpenses
  currency: Currency;
  period: string;          // "Mayo 2025"
}
