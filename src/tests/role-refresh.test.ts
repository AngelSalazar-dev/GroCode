import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

/**
 * With `strategy: "jwt"` the role is copied at sign-in, so demoting an admin
 * left them privileged until the token expired and approving a Senior had no
 * effect until their next sign-in. These tests pin the refresh behaviour.
 */

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

const authConfig = (await import("@/auth/auth.config")).default
const { prisma } = await import("@/lib/prisma")

const jwt = authConfig.callbacks!.jwt as (args: unknown) => Promise<
  Record<string, unknown>
>

const ROLE_REFRESH_MS = 5 * 60 * 1000

describe("callback jwt: refresco del rol", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ role: "JUNIOR" })
  })

  it("firma el rol inicial sin tocar la base de datos", async () => {
    const token = await jwt({ token: {}, user: { id: "u1", role: "ADMIN" } })

    expect(token.role).toBe("ADMIN")
    expect(typeof token.roleCheckedAt).toBe("number")
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it("no consulta la BD si el token es reciente", async () => {
    await jwt({
      token: { id: "u1", role: "ADMIN", roleCheckedAt: Date.now() },
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it("relee el rol cuando el token envejece", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ role: "JUNIOR" })

    const token = await jwt({
      token: {
        id: "u1",
        role: "ADMIN",
        roleCheckedAt: Date.now() - ROLE_REFRESH_MS - 1,
      },
    })

    // The admin was demoted in the database; the token must follow.
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { role: true },
    })
    expect(token.role).toBe("JUNIOR")
  })

  it("propaga una promoción a SENIOR tras el TTL", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ role: "SENIOR" })

    const token = await jwt({
      token: {
        id: "u1",
        role: "JUNIOR",
        roleCheckedAt: Date.now() - ROLE_REFRESH_MS - 1,
      },
    })

    expect(token.role).toBe("SENIOR")
  })

  it("degrada a JUNIOR si la cuenta ya no existe", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue(null)

    const token = await jwt({
      token: {
        id: "borrado",
        role: "ADMIN",
        roleCheckedAt: Date.now() - ROLE_REFRESH_MS - 1,
      },
    })

    expect(token.role).toBe("JUNIOR")
  })

  // A DB blip must not silently strip a legitimate admin's access.
  it("conserva el rol del token si la BD falla (fail-safe, no fail-open)", async () => {
    ;(prisma.user.findUnique as Mock).mockRejectedValue(new Error("ECONNREFUSED"))
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    const token = await jwt({
      token: {
        id: "u1",
        role: "ADMIN",
        roleCheckedAt: Date.now() - ROLE_REFRESH_MS - 1,
      },
    })

    expect(token.role).toBe("ADMIN")
    spy.mockRestore()
  })

  it("no consulta la BD si el token no tiene id", async () => {
    await jwt({
      token: { role: "ADMIN", roleCheckedAt: 0 },
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })
})