import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: vi.fn() },
}))

const { prisma } = await import("@/lib/prisma")
const { GET } = await import("@/app/api/health/route")

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("responde 200 cuando la base responde", async () => {
    ;(prisma.$queryRaw as Mock).mockResolvedValue([{ ok: 1 }])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: "ok", db: "up" })
  })

  it("responde 503 sin filtrar el error de conexión", async () => {
    ;(prisma.$queryRaw as Mock).mockRejectedValue(
      new Error("connect ECONNREFUSED db.internal:5432 user=admin password=hunter2")
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({ status: "degraded", db: "down" })
    expect(body).not.toHaveProperty("error")
    expect(JSON.stringify(body)).not.toContain("hunter2")
  })
})
