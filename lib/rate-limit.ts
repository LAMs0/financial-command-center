/*
  lib/rate-limit.ts — Limitador de tasa en memoria (fixed window).
  ──────────────────────────────────────────────────────────────────
  Protege endpoints caros (p. ej. el OCR de /api/import, que puede tardar
  hasta 120 s con archivos grandes) contra abuso por parte de un usuario
  autenticado: muchas peticiones seguidas que agoten CPU/costo.

  Diseño:
  - Ventana fija por clave (normalmente el userId): N peticiones por ventana.
  - En MEMORIA del proceso. Suficiente para un contenedor único (Railway).
    ⚠️ Si algún día se escala a múltiples instancias, esto NO se comparte
    entre ellas — habría que mover el estado a Redis/Upstash.
  - Se auto-limpia: cada cierto número de llamadas barre las entradas vencidas
    para que el Map no crezca sin límite.
*/

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let callsSinceSweep = 0;
const SWEEP_EVERY = 500;

function sweep(now: number) {
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Milisegundos hasta que la ventana se reinicie (para el header Retry-After). */
  retryAfterMs: number;
  /** Peticiones restantes en la ventana actual. */
  remaining: number;
}

/**
 * Consume una unidad de cuota para `key`. Devuelve si la petición se permite.
 *
 * @param key      Identificador de la cuota (p. ej. `import:<userId>`).
 * @param limit    Máximo de peticiones permitidas por ventana.
 * @param windowMs Duración de la ventana en milisegundos.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (++callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }

  if (b.count >= limit) {
    return { ok: false, retryAfterMs: b.resetAt - now, remaining: 0 };
  }

  b.count++;
  return { ok: true, retryAfterMs: 0, remaining: limit - b.count };
}
