/*
  Barrel export — un solo punto de entrada para todos los datos mock.

  En lugar de importar así en cada componente:
    import { mockAccounts } from "@/lib/mock-data/accounts"
    import { mockCards } from "@/lib/mock-data/cards"

  Importas así:
    import { mockAccounts, mockCards } from "@/lib/mock-data"

  Cuando conectes APIs reales, solo cambias este archivo.
*/
export { mockAccounts } from "./accounts";
export { mockCards } from "./cards";
export { mockTransactions } from "./transactions";
export { mockInvestments } from "./investments";
export { mockGoals } from "./goals";
export { mockMonthlyHistory } from "./history";
export type { MonthlySnapshot } from "./history";
export { mockBudgets } from "./budgets";
export type { Budget } from "./budgets";
