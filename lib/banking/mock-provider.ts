/*
  lib/banking/mock-provider.ts — Proveedor de demostración (gratis, sin API).
  ───────────────────────────────────────────────────────────────────────────
  Implementa `BankProvider` con datos sintéticos deterministas. Sirve para
  desarrollar y probar TODO el flujo (conectar → ver cuentas/transacciones →
  desconectar) sin pagar ni configurar keys de ningún agregador.

  Cuando exista Plaid/Belvo, esta clase no se borra: queda como el proveedor
  por defecto para desarrollo/tests y para entornos sin credenciales.
*/

import type {
  BankInstitution,
  BankProvider,
  BankSyncResult,
  ProviderAccount,
  ProviderTransaction,
} from "./types";

const INSTITUTIONS: BankInstitution[] = [
  { id: "ins_mx_bbva", name: "BBVA", color: "#1464A5", country: "MX" },
  { id: "ins_mx_nu", name: "Nu", color: "#820AD1", country: "MX" },
  { id: "ins_us_wellsfargo", name: "Wells Fargo", color: "#D71E2B", country: "US" },
  { id: "ins_us_chase", name: "Chase", color: "#117ACA", country: "US" },
];

/** ISO "YYYY-MM-DD" de hoy menos `daysAgo` días. */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/*
  Plantillas de cuentas por institución. Cada institución expone una o dos
  cuentas con saldos y moneda coherentes con su país.
*/
const ACCOUNTS: Record<string, ProviderAccount[]> = {
  ins_mx_bbva: [
    { externalId: "bbva_chk", name: "BBVA Débito", type: "checking", balance: 18450.32, currency: "MXN" },
    { externalId: "bbva_sav", name: "BBVA Ahorro", type: "savings", balance: 62300.0, currency: "MXN" },
  ],
  ins_mx_nu: [
    { externalId: "nu_chk", name: "Nu Cuenta", type: "checking", balance: 9120.75, currency: "MXN" },
  ],
  ins_us_wellsfargo: [
    { externalId: "wf_chk", name: "Wells Fargo Checking", type: "checking", balance: 4280.11, currency: "USD" },
    { externalId: "wf_sav", name: "Wells Fargo Savings", type: "savings", balance: 15000.0, currency: "USD" },
  ],
  ins_us_chase: [
    { externalId: "chase_chk", name: "Chase Total Checking", type: "checking", balance: 3325.6, currency: "USD" },
  ],
};

/*
  Genera transacciones recientes para una cuenta, deterministas por externalId.
  Reparte ingresos y gastos en categorías variadas durante los últimos ~25 días.
*/
function transactionsFor(account: ProviderAccount): ProviderTransaction[] {
  const c = account.currency;
  const base: Omit<ProviderTransaction, "accountExternalId" | "currency">[] = [
    { externalId: `${account.externalId}_t1`, description: "Nómina", amount: account.currency === "MXN" ? 16500 : 2400, type: "income", category: "salary", date: daysAgo(2) },
    { externalId: `${account.externalId}_t2`, description: "Supermercado", amount: account.currency === "MXN" ? 1240.5 : 86.32, type: "expense", category: "food", date: daysAgo(4) },
    { externalId: `${account.externalId}_t3`, description: "Uber", amount: account.currency === "MXN" ? 168 : 14.5, type: "expense", category: "transport", date: daysAgo(7) },
    { externalId: `${account.externalId}_t4`, description: "Netflix", amount: account.currency === "MXN" ? 219 : 15.49, type: "expense", category: "entertainment", date: daysAgo(11) },
    { externalId: `${account.externalId}_t5`, description: "Recibo de luz", amount: account.currency === "MXN" ? 540 : 62.0, type: "expense", category: "utilities", date: daysAgo(18) },
  ];
  return base.map((t) => ({ ...t, accountExternalId: account.externalId, currency: c }));
}

class MockBankProvider implements BankProvider {
  readonly id = "mock";
  readonly mode = "direct" as const;

  async listInstitutions(): Promise<BankInstitution[]> {
    return INSTITUTIONS;
  }

  async sync(institutionId: string): Promise<BankSyncResult> {
    const institution = INSTITUTIONS.find((i) => i.id === institutionId);
    if (!institution) {
      throw new Error(`Institución desconocida: ${institutionId}`);
    }
    const accounts = ACCOUNTS[institutionId] ?? [];
    const transactions = accounts.flatMap(transactionsFor);
    return { institution, accounts, transactions };
  }
}

export const mockProvider: BankProvider = new MockBankProvider();
