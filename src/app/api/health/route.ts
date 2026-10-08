import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const TIMEOUT_MS = 5_000

/**
 * Readiness probe.
 *
 * Without this, "the app is down" and "the database is down" look identical and
 * cost hours to diagnose. Returns 503 when the database is unreachable so an
 * external monitor can alert on it.
 */
export async function GET() {
  const startedAt = Date.now()

  const headers = { "cache-control": "no-store" }

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, TIMEOUT_MS)
    return Response.json(
      { status: "ok", db: "up", latencyMs: Date.now() - startedAt },
      { headers }
    )
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        db: "down",
        latencyMs: Date.now() - startedAt,
        // Message only: never leak connection strings or credentials.
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503, headers }
    )
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    ),
  ])
}