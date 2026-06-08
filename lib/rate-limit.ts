import { logger } from "@/lib/logger";

export interface RateLimitResult {
  ok: boolean;
  retryAfterMs: number;
  remaining: number;
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let callsSinceSweep = 0;
const SWEEP_EVERY = 500;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (++callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now, remaining: 0 };
  }

  bucket.count++;
  return { ok: true, retryAfterMs: 0, remaining: limit - bucket.count };
}

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function upstashRateLimit(
  cfg: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowIndex = Math.floor(now / windowMs);
  const redisKey = `rl:${key}:${windowIndex}`;
  const resetAt = (windowIndex + 1) * windowMs;

  const response = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, windowMs],
    ]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash HTTP ${response.status}`);
  const data = (await response.json()) as Array<{ result: number }>;
  const count = Number(data[0]?.result ?? 0);

  if (count > limit) {
    return { ok: false, retryAfterMs: Math.max(0, resetAt - now), remaining: 0 };
  }

  return { ok: true, retryAfterMs: 0, remaining: Math.max(0, limit - count) };
}

// Aviso único: en serverless (Vercel) el limitador en memoria NO se comparte
// entre invocaciones/instancias, así que sin Upstash el throttle es casi
// inefectivo en producción. Logueamos una sola vez para que el gap sea visible.
let warnedNoUpstash = false;

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const cfg = upstashConfig();
  if (!cfg) {
    if (!warnedNoUpstash && process.env.NODE_ENV === "production") {
      warnedNoUpstash = true;
      logger.warn("rate_limit.upstash_not_configured", {
        detail:
          "Rate limit en memoria: en serverless no se comparte entre instancias. " +
          "Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN para un límite efectivo.",
      });
    }
    return memoryRateLimit(key, limit, windowMs);
  }

  try {
    return await upstashRateLimit(cfg, key, limit, windowMs);
  } catch (error) {
    logger.warn("rate_limit.upstash_failed", {
      error: error instanceof Error ? error.message : String(error),
      key,
    });
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }
}
