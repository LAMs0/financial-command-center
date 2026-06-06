/*
  lib/banking/types.ts — Contrato de la conectividad bancaria.
  ────────────────────────────────────────────────────────────
  Igual que lib/data desacopla la UI de la fuente de datos, lib/banking
  desacopla la app del AGREGADOR bancario concreto (Plaid, Belvo, etc.).

  La app habla SIEMPRE con la interfaz `BankProvider`. Hoy el proveedor por
  defecto es `mock` (gratis, sin API keys); mañana se enchufa Plaid/Belvo
  implementando esta misma interfaz — sin tocar la UI ni las server actions.

  Switch por entorno (espejo de DATA_SOURCE):
    BANK_PROVIDER=mock   → proveedor de demostración (DEFAULT)
    BANK_PROVIDER=plaid  → Plaid (requiere keys; ver plaid-provider.ts)
*/

import type {
  AccountType,
  Currency,
  TransactionCategory,
  TransactionType,
} from "@/types/finance";

/** Una institución financiera ofrecida por el proveedor para conectar. */
export interface BankInstitution {
  /** Id estable del proveedor (ej: "ins_mx_bbva", o el institution_id de Plaid). */
  id: string;
  name: string;
  /** Color de marca (hex) para pintar las cuentas creadas. */
  color: string;
  country: "MX" | "US";
}

/** Cuenta tal como la devuelve el proveedor, ya normalizada a nuestros tipos. */
export interface ProviderAccount {
  /** Id de la cuenta en el proveedor (no nuestro id de DB). */
  externalId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: Currency;
}

/** Transacción normalizada del proveedor. */
export interface ProviderTransaction {
  externalId: string;
  /** Apunta al `externalId` de la ProviderAccount a la que pertenece. */
  accountExternalId: string;
  description: string;
  /** Siempre positivo — el `type` indica ingreso/gasto/transferencia. */
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  currency: Currency;
}

/** Resultado de sincronizar una institución: cuentas + sus transacciones. */
export interface BankSyncResult {
  institution: BankInstitution;
  accounts: ProviderAccount[];
  transactions: ProviderTransaction[];
}

/*
  Resultado de canjear un public_token de Plaid por un access_token.
  El access_token es un secreto de larga duración: se guarda CIFRADO
  (BankConnection.accessTokenCipher) y nunca llega al cliente.
*/
export interface ExchangeResult {
  /** access_token en texto plano — el llamador lo cifra antes de persistir. */
  accessToken: string;
  /** item_id de Plaid (identifica la conexión banco↔usuario). */
  itemId: string;
  institution: BankInstitution;
}

/*
  El contrato que todo proveedor debe cumplir.

  Nota sobre Plaid: su flujo real es createLinkToken → Plaid Link (UI) →
  exchangePublicToken → accountsGet/transactionsSync. Aquí lo colapsamos en
  `sync(institutionId)` para el mock; el adaptador de Plaid documenta cómo
  mapear ese flujo a esta interfaz (ver plaid-provider.ts).
*/
export interface BankProvider {
  /** Identificador del proveedor activo ("mock" | "plaid" | ...). */
  readonly id: string;
  /*
    Modo de conexión, decide qué UI renderiza ConnectBank:
      "direct" → el proveedor expone una lista de instituciones y conectar es
                 un único `sync(institutionId)` (mock).
      "link"   → conexión interactiva vía widget del agregador (Plaid Link):
                 el usuario elige el banco e ingresa credenciales en el widget,
                 no en nuestra UI. Aquí `listInstitutions`/`sync` no se usan.
  */
  readonly mode: "direct" | "link";
  /** Instituciones disponibles para conectar (solo modo "direct"). */
  listInstitutions(): Promise<BankInstitution[]>;
  /** Conecta/sincroniza una institución y devuelve cuentas+transacciones (modo "direct"). */
  sync(institutionId: string): Promise<BankSyncResult>;
}
