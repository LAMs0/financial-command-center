/*
  Presupuestos mensuales por categoría.

  Cada Budget tiene:
  - allocated: lo que el usuario planificó gastar
  - spent: lo que realmente gastó (calculado a partir de transactions en producción;
    aquí lo dejamos precalculado para mantener la simplicidad del mock)

  Los valores `spent` coinciden exactamente con la suma de transactions.ts
  para que los datos sean consistentes en toda la app.
*/

export interface Budget {
  id: string;
  category: string;
  /** Nombre legible de la categoría */
  label: string;
  /** Presupuesto asignado para el mes */
  allocated: number;
  /** Gasto real del mes (suma de transactions de esta categoría) */
  spent: number;
  currency: "MXN" | "USD" | "EUR";
  /** Color de acento para íconos y highlights */
  color: string;
}

export const mockBudgets: Budget[] = [
  {
    id: "bud-001",
    category: "housing",
    label: "Housing",
    allocated: 10_000,
    spent: 9_500,   // txn-002: Renta $9,500
    currency: "MXN",
    color: "#3b82f6",
  },
  {
    id: "bud-002",
    category: "food",
    label: "Food",
    allocated: 3_000,
    spent: 1_635,   // txn-003: $285 + txn-006: $1,350
    currency: "MXN",
    color: "#10b981",
  },
  {
    id: "bud-003",
    category: "transport",
    label: "Transport",
    allocated: 1_500,
    spent: 800,     // txn-005: Gasolinera $800
    currency: "MXN",
    color: "#14b8a6",
  },
  {
    id: "bud-004",
    category: "entertainment",
    label: "Entertainment",
    allocated: 600,
    spent: 219,     // txn-004: Netflix $219
    currency: "MXN",
    color: "#8b5cf6",
  },
  {
    id: "bud-005",
    category: "health",
    label: "Health & Fitness",
    allocated: 700,
    spent: 699,     // txn-009: Gimnasio $699
    currency: "MXN",
    color: "#f59e0b",
  },
  {
    id: "bud-006",
    category: "shopping",
    label: "Shopping",
    allocated: 1_500,
    spent: 1_890,   // txn-010: Amazon $1,890 — OVER BUDGET
    currency: "MXN",
    color: "#ef4444",
  },
  {
    id: "bud-007",
    category: "services",
    label: "Subscriptions",
    allocated: 500,
    spent: 0,       // Sin gastos este mes
    currency: "MXN",
    color: "#6366f1",
  },
];
