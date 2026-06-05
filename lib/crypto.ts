/*
  lib/crypto.ts — Cifrado simétrico para secretos en reposo (AES-256-GCM).
  ──────────────────────────────────────────────────────────────────────────
  Se usa para cifrar datos sensibles ANTES de guardarlos en la DB; el caso
  principal es el `access_token` de un agregador bancario (Plaid/Belvo), que
  nunca debe persistir en texto plano (BankConnection.accessTokenCipher).

  - Algoritmo: AES-256-GCM (cifrado autenticado: confidencialidad + integridad).
  - Clave: 32 bytes en hex (64 chars) desde APP_ENCRYPTION_KEY. Genera con:
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  - Formato de salida: "iv.tag.ciphertext", cada parte en base64. El IV es
    aleatorio por mensaje (12 bytes, recomendado para GCM).

  ⚠️ Solo servidor (usa el módulo `crypto` de Node). Nunca importar en cliente.
*/

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  type CipherGCMTypes,
} from "crypto";

const ALGORITHM: CipherGCMTypes = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits — tamaño recomendado para GCM
const KEY_LENGTH = 32; // 256 bits

function getKey(): Buffer {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "APP_ENCRYPTION_KEY no está definida. Genera una con: " +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `APP_ENCRYPTION_KEY debe ser de ${KEY_LENGTH} bytes en hex (${KEY_LENGTH * 2} caracteres).`
    );
  }
  return key;
}

/** Cifra un texto plano. Devuelve "iv.tag.ciphertext" (cada parte en base64). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

/** Descifra un payload generado por encryptSecret. Lanza si fue manipulado. */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Payload cifrado con formato inválido (se esperaba iv.tag.ciphertext).");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag); // verifica integridad: lanza si el tag no cuadra
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
