/**
 * Structured server-side logging.
 *
 * Replaces free-form `console.error("Error en X:", error)` with one JSON line,
 * so a log aggregator can filter by `event` and `level` instead of grepping.
 *
 * Two things are deliberately never written:
 * - the raw error object (Prisma attaches query parameters, which can include
 *   the email of whoever just registered);
 * - any email, redacted here as `[email]` because it appears in messages too.
 */

type Level = "info" | "warn" | "error"

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g

function redact(value: string): string {
  return value.replace(EMAIL_PATTERN, "[email]")
}

/** Keep only the diagnostic parts of an error: no stack, no query params. */
function describe(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code
    return {
      name: error.name,
      message: redact(error.message),
      ...(typeof code === "string" ? { code } : {}),
    }
  }
  return { message: redact(String(error)) }
}

function emit(level: Level, event: string, fields: Record<string, unknown> = {}) {
  // Pulled out before spreading: a Prisma error carries enumerable own props
  // (`meta`, `clientVersion`) whose JSON form leaks query parameters.
  const { error, ...rest } = fields

  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...rest,
    ...(error !== undefined ? { error: describe(error) } : {}),
  })

  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
}
