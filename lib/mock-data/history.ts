/*
  Datos históricos mensuales para alimentar los charts de Phase 2.

  ¿Por qué datos separados?
  Los datos mock actuales (cuentas, transacciones) representan un snapshot del
  momento presente. Las gráficas de series de tiempo necesitan un historial
  de varios meses. En lugar de calcular esto a partir de transacciones (que
  implicaría lógica compleja), usamos datos históricos precalculados.

  Cuando conectes una API real, este archivo se reemplaza por llamadas
  a un endpoint como /api/history?months=6.
*/

export interface MonthlySnapshot {
  /** Formato: "YYYY-MM" para poder ordenar y mostrar */
  month: string;
  /** Etiqueta corta para los ejes de las gráficas */
  label: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  income: number;
  expenses: number;
}

/**
 * Historial de los últimos 6 meses (de más antiguo a más reciente).
 * El último mes refleja los valores actuales de los datos mock.
 */
export const mockMonthlyHistory: MonthlySnapshot[] = [
  {
    month: "2024-12",
    label: "Dec",
    netWorth: 172_400,
    assets: 191_000,
    liabilities: 18_600,
    income: 42_000,
    expenses: 31_200,
  },
  {
    month: "2025-01",
    label: "Jan",
    netWorth: 176_800,
    assets: 194_000,
    liabilities: 17_200,
    income: 42_000,
    expenses: 28_900,
  },
  {
    month: "2025-02",
    label: "Feb",
    netWorth: 181_200,
    assets: 197_700,
    liabilities: 16_500,
    income: 42_000,
    expenses: 26_400,
  },
  {
    month: "2025-03",
    label: "Mar",
    netWorth: 179_900,
    assets: 195_000,
    liabilities: 15_100,
    income: 42_000,
    expenses: 33_800,
  },
  {
    month: "2025-04",
    label: "Apr",
    netWorth: 188_400,
    assets: 202_000,
    liabilities: 13_600,
    income: 42_000,
    expenses: 27_100,
  },
  {
    month: "2025-05",
    label: "May",
    netWorth: 196_751,
    assets: 210_001,
    liabilities: 13_250,
    income: 42_000,
    expenses: 19_700,
  },
];
