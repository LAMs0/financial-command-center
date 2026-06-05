import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

// Clave de prueba determinista para todo el archivo.
beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

describe("crypto AES-256-GCM", () => {
  it("descifra a lo que se cifró (round-trip)", () => {
    const secret = "access-sandbox-1234567890-token";
    const cipher = encryptSecret(secret);
    expect(decryptSecret(cipher)).toBe(secret);
  });

  it("nunca expone el texto plano en el payload cifrado", () => {
    const secret = "super-secreto";
    const cipher = encryptSecret(secret);
    expect(cipher).not.toContain(secret);
    expect(cipher.split(".")).toHaveLength(3);
  });

  it("produce un ciphertext distinto cada vez (IV aleatorio)", () => {
    const a = encryptSecret("mismo-valor");
    const b = encryptSecret("mismo-valor");
    expect(a).not.toBe(b);
    // pero ambos descifran al mismo valor
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("falla al descifrar si el ciphertext fue manipulado (integridad GCM)", () => {
    const cipher = encryptSecret("intacto");
    const [iv, tag] = cipher.split(".");
    // Reemplazamos el ciphertext por otro contenido (manipulación).
    const tampered = [iv, tag, Buffer.from("otro-contenido").toString("base64")].join(".");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("lanza con formato inválido", () => {
    expect(() => decryptSecret("no-tiene-tres-partes")).toThrow();
  });

  it("lanza si la clave no está configurada", () => {
    const saved = process.env.APP_ENCRYPTION_KEY;
    delete process.env.APP_ENCRYPTION_KEY;
    try {
      expect(() => encryptSecret("x")).toThrow(/APP_ENCRYPTION_KEY/);
    } finally {
      process.env.APP_ENCRYPTION_KEY = saved;
    }
  });
});
