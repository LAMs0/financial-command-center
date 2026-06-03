/*
  lib/banking/plaid-provider.ts — Adaptador de Plaid (stub documentado).
  ───────────────────────────────────────────────────────────────────────
  Plaid NO está implementado todavía a propósito: cobra por datos reales y
  el SDK (`plaid`) aún no es dependencia. Este archivo deja el "hueco" listo
  para enchufarlo sin reescribir la app — solo implementar los métodos.

  Cómo completar (cuando se quiera producción):
  ──────────────────────────────────────────────
  1. `npm i plaid` y crear cuenta en https://dashboard.plaid.com
     - El entorno **Sandbox es gratis** (datos ficticios) → ideal para
       desarrollar. Solo Development/Production con datos reales cobran.
  2. Variables de entorno (.env):
       PLAID_CLIENT_ID=...
       PLAID_SECRET=...
       PLAID_ENV=sandbox            # sandbox | development | production
  3. El flujo real de Plaid no es un único `sync()`, sino:
       a) Server: link_token = plaid.linkTokenCreate(...)
       b) Cliente: <PlaidLink> con ese link_token → devuelve public_token
       c) Server: access_token = plaid.itemPublicTokenExchange(public_token)
          → guardar access_token CIFRADO (requiere un modelo BankConnection)
       d) Server: plaid.accountsGet(access_token) + plaid.transactionsSync(...)
          → mapear la respuesta a ProviderAccount[] / ProviderTransaction[].
  4. `sync(institutionId)` aquí asume que ya existe un access_token para el
     usuario; en una integración real `connectInstitution` orquestaría a..d.

  Mientras tanto, cualquier intento de usar este proveedor avisa claramente
  en vez de fallar en silencio.
*/

import type { BankInstitution, BankProvider, BankSyncResult } from "./types";

const NOT_CONFIGURED =
  "El proveedor Plaid aún no está implementado. Usa BANK_PROVIDER=mock o " +
  "completa lib/banking/plaid-provider.ts (instala `plaid` y configura PLAID_*).";

class PlaidBankProvider implements BankProvider {
  readonly id = "plaid";

  async listInstitutions(): Promise<BankInstitution[]> {
    throw new Error(NOT_CONFIGURED);
  }

  async sync(_institutionId: string): Promise<BankSyncResult> {
    throw new Error(NOT_CONFIGURED);
  }
}

export const plaidProvider: BankProvider = new PlaidBankProvider();
