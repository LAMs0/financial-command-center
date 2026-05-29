/*
  Presupuestos mensuales por categoria.

  Cada Budget tiene:
  - allocated: lo que el usuario planifico gastar
  - spent: lo que realmente gasto
  - icon: nombre del icono lucide que representa la categoria
*/

export interface Budget {
  id: string;
  category: string;
  /** Nombre legible de la categoria */
  label: string;
  /** Presupuesto asignado para el mes */
  allocated: number;
  /** Gasto real del mes */
  spent: number;
  currency: "MXN" | "USD" | "EUR";
  /** Color de acento para iconos y highlights */
  color: string;
  /** Nombre del icono lucide asociado a la categoria */
  icon: string;
}

export const mockBudgets: Budget[] = [
  {
    id: "bud-001",
    category: "housing",
    label: "Housing",
    allocated: 10_000,
    spent: 9_500,
    currency: "MXN",
    color: "#3b82f6",
    icon: "Home",
  },
  {
    id: "bud-002",
    category: "food",
    label: "Food",
    allocated: 3_000,
    spent: 1_635,
    currency: "MXN",
    color: "#10b981",
    icon: "Utensils",
  },
  {
    id: "bud-003",
    category: "transport",
    label: "Transport",
    allocated: 1_500,
    spent: 800,
    currency: "MXN",
    color: "#14b8a6",
    icon: "Car",
  },
  {
    id: "bud-004",
    category: "entertainment",
    label: "Entertainment",
    allocated: 600,
    spent: 219,
    currency: "MXN",
    color: "#8b5cf6",
    icon: "Tv2",
  },
  {
    id: "bud-005",
    category: "health",
    label: "Health & Fitness",
    allocated: 700,
    spent: 699,
    currency: "MXN",
    color: "#f59e0b",
    icon: "Dumbbell",
  },
  {
    id: "bud-006",
    category: "shopping",
    label: "Shopping",
    allocated: 1_500,
    spent: 1_890,
    currency: "MXN",
    color: "#ef4444",
    icon: "ShoppingBag",
  },
  {
    id: "bud-007",
    category: "services",
    label: "Subscriptions",
    allocated: 500,
    spent: 0,
    currency: "MXN",
    color: "#6366f1",
    icon: "Zap",
  },
];
