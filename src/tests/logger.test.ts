import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { logger } from "@/lib/logger"

function lastLine(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const raw = spy.mock.calls.at(-1)?.[0]
  return JSON.parse(String(raw))
}

describe("logger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("emite una línea JSON con level y event", () => {
    logger.error("createPost.failed", { error: new Error("boom") })

    const line = lastLine(errorSpy)
    expect(line.level).toBe("error")
    expect(line.event).toBe("createPost.failed")
    expect(line.error).toMatchObject({ name: "Error", message: "boom" })
  })

  it("redacta emails del mensaje", () => {
    logger.error("registerUser.failed", { error: new Error("duplicado: ana@example.com") })

    const line = lastLine(errorSpy)
    expect(JSON.stringify(line)).not.toContain("ana@example.com")
    expect(JSON.stringify(line)).toContain("[email]")
  })

  it("no serializa el objeto de error de Prisma ni sus metadatos", () => {
    // Shape of a PrismaClientKnownRequestError: `meta` carries the query and
    // its parameters, which is exactly what must not reach the log.
    const prismaError = Object.assign(new Error("falló para ana@example.com"), {
      code: "P2002",
      clientVersion: "6.1.0",
      meta: { target: ["email"], query: "INSERT ... 'ana@example.com'" },
    })

    logger.error("registerUser.failed", { error: prismaError })

    const text = JSON.stringify(lastLine(errorSpy))
    expect(text).toContain("P2002")
    expect(text).not.toContain("INSERT")
    expect(text).not.toContain("ana@example.com")
    expect(text).not.toContain("clientVersion")
  })
})
