/*
  Monthly historical data for charts.

  The current app still uses mock values while the real data layer is being
  connected. This file only controls the historical timeline shown by the
  month selector and charts.
*/

export interface MonthlySnapshot {
  /** Format: "YYYY-MM" for sorting and display */
  month: string;
  /** Short fallback label. UI components render full month names from `month`. */
  label: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  income: number;
  expenses: number;
}

/**
 * Full-year history, oldest to newest.
 * The last month reflects the current mock snapshot.
 */
export const mockMonthlyHistory: MonthlySnapshot[] = [
  {
    month: "2025-01",
    label: "Jan",
    netWorth: 171_200,
    assets: 190_100,
    liabilities: 18_900,
    income: 40_500,
    expenses: 31_700,
  },
  {
    month: "2025-02",
    label: "Feb",
    netWorth: 173_600,
    assets: 192_200,
    liabilities: 18_600,
    income: 41_000,
    expenses: 30_900,
  },
  {
    month: "2025-03",
    label: "Mar",
    netWorth: 175_300,
    assets: 193_400,
    liabilities: 18_100,
    income: 41_500,
    expenses: 32_300,
  },
  {
    month: "2025-04",
    label: "Apr",
    netWorth: 176_800,
    assets: 194_000,
    liabilities: 17_200,
    income: 42_000,
    expenses: 28_900,
  },
  {
    month: "2025-05",
    label: "May",
    netWorth: 181_200,
    assets: 197_700,
    liabilities: 16_500,
    income: 42_000,
    expenses: 26_400,
  },
  {
    month: "2025-06",
    label: "Jun",
    netWorth: 179_900,
    assets: 195_000,
    liabilities: 15_100,
    income: 42_000,
    expenses: 33_800,
  },
  {
    month: "2025-07",
    label: "Jul",
    netWorth: 183_500,
    assets: 198_200,
    liabilities: 14_700,
    income: 42_000,
    expenses: 30_400,
  },
  {
    month: "2025-08",
    label: "Aug",
    netWorth: 186_100,
    assets: 200_200,
    liabilities: 14_100,
    income: 42_000,
    expenses: 29_500,
  },
  {
    month: "2025-09",
    label: "Sep",
    netWorth: 188_400,
    assets: 202_000,
    liabilities: 13_600,
    income: 42_000,
    expenses: 27_100,
  },
  {
    month: "2025-10",
    label: "Oct",
    netWorth: 191_300,
    assets: 204_700,
    liabilities: 13_400,
    income: 42_000,
    expenses: 25_800,
  },
  {
    month: "2025-11",
    label: "Nov",
    netWorth: 194_200,
    assets: 207_500,
    liabilities: 13_300,
    income: 42_000,
    expenses: 24_600,
  },
  {
    month: "2025-12",
    label: "Dec",
    netWorth: 196_751,
    assets: 210_001,
    liabilities: 13_250,
    income: 42_000,
    expenses: 19_700,
  },
];
