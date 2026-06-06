/*
  lib/banking/plaid-provider.ts — Adaptador REAL de Plaid.
  ───────────────────────────────────────────────────────────────────────
  Plaid no encaja en el flujo "direct" de un solo `sync(institutionId)` del
  mock: su conexión es INTERACTIVA (el usuario elige banco y mete credenciales
  en el widget de Plaid Link, no en nuestra UI). Por eso este proveedor declara
  `mode = "link"` y expone funciones específicas que orquestan las server
  actions:

    1. createLinkToken(userId)          → server: genera el link_token
       └─ cliente: <PlaidLink> con ese token → devuelve un public_token
    2. exchangePublicToken(public_token) → server: lo canjea por un access_token
       (secreto de larga duración) + datos de la institución
    3. syncByAccessToken(accessToken)    → server: trae cuentas + transacciones
       ya normalizadas a NUESTROS tipos (ProviderAccount / ProviderTransaction)

  El access_token se cifra (lib/crypto) y se guarda en BankConnection; nunca
  llega al cliente ni se loguea.

  Entorno Sandbox = gratis, datos ficticios. Credenciales de prueba en el
  widget: usuario `user_good`, contraseña `pass_good`.
*/

import {
  CountryCode,
  Products,
  type AccountBase,
  type Transaction as PlaidTransaction,
} from "plaid";
import type {
  AccountType,
  Currency,
  TransactionCategory,
  TransactionType,
} from "@/types/finance";
import { getPlaidClient } from "./plaid-client";
import type {
  BankInstitution,
  BankProvider,
  BankSyncResult,
  ExchangeResult,
  ProviderAccount,
  ProviderTransaction,
} from "./types";

const CLIENT_NAME = "Financial Command Center";
// País del producto. Sandbox usa bancos US (user_good/pass_good). Si en el
// futuro habilitas MX, añade CountryCode.Mx aquí y en linkTokenCreate.
const COUNTRY_CODES = [CountryCode.Us];

// ─── Mapeos Plaid → tipos de dominio ──────────────────────────────────────

function mapCurrency(code: string | null | undefined): Currency {
  switch ((code ?? "").toUpperCase()) {
    case "MXN":
      return "MXN";
    case "EUR":
      return "EUR";
    default:
      return "USD";
  }
}

function mapAccountType(account: AccountBase): AccountType {
  if (account.type === "investment" || account.type === "brokerage") return "investment";
  if (account.subtype === "savings") return "savings";
  if (account.subtype === "checking") return "checking";
  // depository sin subtipo claro, money market, etc. → tratamos como líquido.
  return account.type === "depository" ? "checking" : "cash";
}

/*
  Plaid clasifica los movimientos con su taxonomía "Personal Finance Category"
  (campo personal_finance_category.primary). La traducimos a NUESTRAS categorías.
*/
const PFC_TO_CATEGORY: Record<string, TransactionCategory> = {
  INCOME: "salary",
  TRANSFER_IN: "transfer",
  TRANSFER_OUT: "transfer",
  LOAN_PAYMENTS: "other",
  BANK_FEES: "other",
  ENTERTAINMENT: "entertainment",
  FOOD_AND_DRINK: "food",
  GENERAL_MERCHANDISE: "shopping",
  HOME_IMPROVEMENT: "housing",
  MEDICAL: "health",
  PERSONAL_CARE: "health",
  GENERAL_SERVICES: "other",
  GOVERNMENT_AND_NON_PROFIT: "other",
  TRANSPORTATION: "transport",
  TRAVEL: "travel",
  RENT_AND_UTILITIES: "utilities",
};

function mapCategory(primary: string | undefined): TransactionCategory {
  if (!primary) return "other";
  return PFC_TO_CATEGORY[primary] ?? "other";
}

/*
  Tipo (ingreso/gasto/transferencia). Convención de signo de Plaid:
  amount POSITIVO = dinero que SALE de la cuenta (gasto); NEGATIVO = entra.
*/
function mapType(tx: PlaidTransaction): TransactionType {
  const primary = tx.personal_finance_category?.primary ?? "";
  if (primary.startsWith("TRANSFER")) return "transfer";
  if (primary === "INCOME") return "income";
  return tx.amount < 0 ? "income" : "expense";
}

// ─── Provider (implementa la interfaz; modo "link") ───────────────────────

class PlaidBankProvider implements BankProvider {
  readonly id = "plaid";
  readonly mode = "link" as const;

  // En modo "link" la selección de banco la hace el widget de Plaid, no
  // nuestra UI: no exponemos catálogo de instituciones.
  async listInstitutions(): Promise<BankInstitution[]> {
    return [];
  }

  // `sync` directo no aplica a Plaid (su flujo pasa por link → exchange).
  async sync(): Promise<BankSyncResult> {
    throw new Error(
      "Plaid usa el flujo interactivo (Plaid Link). Usa createLinkToken + exchangePublicToken."
    );
  }
}

export const plaidProvider: BankProvider = new PlaidBankProvider();

// ─── Flujo de conexión (lo llaman las server actions) ─────────────────────

/** Paso 1: genera el link_token que el widget Plaid Link consume en el cliente. */
export async function createLinkToken(userId: string): Promise<string> {
  const client = getPlaidClient();
  const res = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: CLIENT_NAME,
    products: [Products.Transactions],
    country_codes: COUNTRY_CODES,
    language: "en",
  });
  return res.data.link_token;
}

/** Paso 2: canjea el public_token por un access_token + datos de la institución. */
export async function exchangePublicToken(publicToken: string): Promise<ExchangeResult> {
  const client = getPlaidClient();

  const exchange = await client.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchange.data.access_token;
  const itemId = exchange.data.item_id;

  // Resolver la institución para nombrar/colorear las cuentas creadas.
  let institution: BankInstitution = {
    id: "unknown",
    name: "Banco",
    color: "#10b981",
    country: "US",
  };

  const item = await client.itemGet({ access_token: accessToken });
  const institutionId = item.data.item.institution_id;
  if (institutionId) {
    try {
      const inst = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: COUNTRY_CODES,
        options: { include_optional_metadata: true },
      });
      institution = {
        id: institutionId,
        name: inst.data.institution.name,
        color: inst.data.institution.primary_color ?? "#10b981",
        country: "US",
      };
    } catch {
      // Si falla la metadata, seguimos con el id real y nombre genérico.
      institution = { ...institution, id: institutionId };
    }
  }

  return { accessToken, itemId, institution };
}

/** Paso 3: trae cuentas + transacciones normalizadas a nuestros tipos. */
export async function syncByAccessToken(
  accessToken: string,
  institution: BankInstitution
): Promise<BankSyncResult> {
  const client = getPlaidClient();

  const accountsRes = await client.accountsGet({ access_token: accessToken });
  const accounts: ProviderAccount[] = accountsRes.data.accounts.map((account) => ({
    externalId: account.account_id,
    name: account.name,
    type: mapAccountType(account),
    balance: account.balances.current ?? account.balances.available ?? 0,
    currency: mapCurrency(account.balances.iso_currency_code),
  }));

  // transactionsSync pagina con un cursor; iteramos hasta has_more = false.
  const added: PlaidTransaction[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;
  while (hasMore) {
    const res = await client.transactionsSync({
      access_token: accessToken,
      cursor,
    });
    added.push(...res.data.added);
    hasMore = res.data.has_more;
    cursor = res.data.next_cursor;
  }

  const transactions: ProviderTransaction[] = added.map((tx) => ({
    externalId: tx.transaction_id,
    accountExternalId: tx.account_id,
    description: tx.name,
    amount: Math.abs(tx.amount),
    type: mapType(tx),
    category: mapCategory(tx.personal_finance_category?.primary),
    date: tx.date, // ya viene "YYYY-MM-DD"
    currency: mapCurrency(tx.iso_currency_code),
  }));

  return { institution, accounts, transactions };
}
