/*
  lib/banking/plaid-client.ts — Cliente SDK de Plaid (solo servidor).
  ──────────────────────────────────────────────────────────────────────
  Crea UNA instancia configurada de `PlaidApi` a partir de las variables de
  entorno. Se importa desde el adaptador (`plaid-provider.ts`) y nunca desde
  el cliente (las keys son secretas).

  Variables requeridas (ver .env.example):
    PLAID_CLIENT_ID   — tu Client ID (no es secreto crítico)
    PLAID_SECRET      — el secret del entorno elegido (¡secreto!)
    PLAID_ENV         — "sandbox" | "development" | "production"

  El Sandbox es gratis y usa datos ficticios; las credenciales de prueba son
  usuario `user_good` / contraseña `pass_good`.
*/

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let cached: PlaidApi | null = null;

/** Devuelve el cliente Plaid (singleton). Lanza si faltan las keys. */
export function getPlaidClient(): PlaidApi {
  if (cached) return cached;

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

  if (!clientId || !secret) {
    throw new Error(
      "Faltan PLAID_CLIENT_ID / PLAID_SECRET. Defínelas en .env (entorno Sandbox es gratis)."
    );
  }
  if (!(env in PlaidEnvironments)) {
    throw new Error(`PLAID_ENV inválido: "${env}". Usa sandbox | development | production.`);
  }

  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  cached = new PlaidApi(config);
  return cached;
}
