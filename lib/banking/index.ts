/*
  lib/banking — Punto de entrada de la conectividad bancaria.
  ────────────────────────────────────────────────────────────
  La app importa SIEMPRE desde aquí:

    import { getBankProvider } from "@/lib/banking";

  El proveedor concreto se elige por la variable de entorno BANK_PROVIDER,
  igual que DATA_SOURCE elige la fuente de datos. Default = "mock" (gratis).
*/

import type { BankProvider } from "./types";
import { mockProvider } from "./mock-provider";
import { plaidProvider } from "./plaid-provider";

export type {
  BankInstitution,
  BankProvider,
  BankSyncResult,
  ProviderAccount,
  ProviderTransaction,
} from "./types";

export function getBankProvider(): BankProvider {
  switch (process.env.BANK_PROVIDER) {
    case "plaid":
      return plaidProvider;
    case "mock":
    default:
      return mockProvider;
  }
}
