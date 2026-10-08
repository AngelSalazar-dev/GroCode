/**
 * In-memory sliding-window rate limiter.
 *
 * Scope: single-instance only. On serverless (Vercel) each warm lambda keeps
 * its own map, so this raises the cost of abuse but is not a hard guarantee.
 * If you need a real limit, swap the Map for Redis/Upstash — the interface
 * (`limit()`) is the only thing callers depend on.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Cheap eviction so the map cannot grow without bound.
const SWEEP_INTERVAL_MS = 60_000
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type LimitResult = {
  ok: boolean
  remaining: number
  /** Seconds until the bucket frees up. */
  retryAfter: number
}

export function limit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfter: 0 }
  }

  bucket.count += 1

  if (bucket.count > max) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }

  return { ok: true, remaining: max - bucket.count, retryAfter: 0 }
}

/**
 * Best-effort client IP.
 *
 * Order matters: `x-forwarded-for` is client-supplied and trivially spoofed, so
 * it is only the last resort. On Vercel the platform-set headers come first.
 *
 * Uses `||` rather than `??` so a header that is present but empty does not
 * produce `""` — that would collapse every misconfigured client into one
 * shared bucket.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
    "unknown"
  )
}

/**
 * Clear all buckets. Intended for tests, where the module-level Map would
 * otherwise leak limits between test cases in the same file.
 */
export function resetRateLimits(): void {
  buckets.clear()
  lastSweep = 0
}
