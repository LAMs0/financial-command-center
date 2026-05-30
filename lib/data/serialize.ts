/*
  serialize.ts — Helpers para convertir tipos de Prisma → tipos de dominio.

  ¿Por qué hace falta esto?
  Prisma no devuelve primitivos de JS "planos":
    - Los campos Decimal (balance, amount, ...) llegan como objetos Prisma.Decimal,
      NO como `number`. Si pasas un Decimal a un Client Component de React, Next.js
      lanza un error de serialización ("Only plain objects can be passed...").
    - Los campos DateTime llegan como objetos `Date`.

  Nuestros tipos de dominio (types/finance.ts) usan `number` y `string` (ISO).
  Estas funciones hacen esa traducción en UN solo lugar, así el resto de la app
  nunca toca un Prisma.Decimal.
*/

/** Convierte un Decimal de Prisma (o number/string) a number plano. */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  // Prisma.Decimal expone .toNumber(); number/string los maneja Number().
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

/** Convierte un Date de Prisma a string ISO de fecha: "2025-05-27". */
export function toISODate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}
