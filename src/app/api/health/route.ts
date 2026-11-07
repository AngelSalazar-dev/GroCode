import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

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
    // The detail goes to the server log; the body stays generic because a
    // driver message can carry the host, the user and the database name.
    logger.error("health.db_down", { error, latencyMs: Date.now() - startedAt })
    return Response.json(
      {
        status: "degraded",
        db: "down",
        latencyMs: Date.now() - startedAt,
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