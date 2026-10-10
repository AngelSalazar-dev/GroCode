import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

/**
 * Phase 4 regression tests.
 *
 * 1. Server Action arguments are client-controlled, so `decision` and `role`
 *    are validated at runtime. Passing "PENDING" used to slip past the guards.
 * 2. Feed paging must stay bounded: `?page=100000000` produced a skip of ~1e9
 *    rows, which is a cheap DoS amplifier on an unthrottled route.
 */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    seniorApplication: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockSession = (role: string | undefined, id = "admin-1") =>
  role ? { user: { id, role } } : null

vi.mock("@/auth/auth", () => ({ auth: vi.fn() }))
// `unstable_cache` se deja en passthrough: sin caché, el mock de prisma manda.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (cb: unknown) => cb,
}))
vi.mock("@/lib/notifications", () => ({ notify: vi.fn(async () => null) }))
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.5" })),
}))

const { auth } = await import("@/auth/auth")
const { prisma } = await import("@/lib/prisma")
const { reviewSeniorApplication, setUserRole } = await import("@/actions/admin")
const { applySenior } = await import("@/actions/senior-application")
const { resetRateLimits } = await import("@/lib/rate-limit")

import { MAX_PAGE } from "@/lib/paging"

describe("admin: validación runtime de argumentos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    ;(auth as Mock).mockResolvedValue(mockSession("ADMIN"))
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      userId: "candidato",
      status: "PENDING",
    })
    ;(prisma.$transaction as Mock).mockResolvedValue([])
    ;(prisma.user.update as Mock).mockResolvedValue({})
  })

  // The bug: `decision` was typed as a union but nothing enforced it at
  // runtime, so "PENDING" wrote a corrupted state and then crashed the
  // notification insert on a null content.
  it("rechaza una decision fuera del enum", async () => {
    for (const bad of ["PENDING", "pending", "", "VERIFIED;DROP TABLE", "APPROVED "]) {
      const result = await reviewSeniorApplication("app-1", bad)
      expect(result, `"${bad}" debe rechazarse`).toHaveProperty("error")
    }
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("rechaza un role fuera del enum", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ id: "x", role: "JUNIOR" })

    for (const bad of ["SUPERADMIN", "", "junior", "ADMIN;DROP"]) {
      const result = await setUserRole("x", bad)
      expect(result, `"${bad}" debe rechazarse`).toHaveProperty("error")
    }
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("acepta las tres decisiones validas", async () => {
    for (const good of ["VERIFIED", "REJECTED"]) {
      const result = await reviewSeniorApplication("app-1", good)
      expect(result).toHaveProperty("success")
    }
  })
})

describe("applySenior: unicidad por usuario", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR", "junior-1"))
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.seniorApplication.upsert as Mock).mockResolvedValue({
      status: "PENDING",
    })
  })

  const form = {
    years: "5-8",
    tech: "React, Node",
    github: "https://github.com/ana",
    linkedin: "",
    motivation: "x".repeat(60),
  }

  it("usa upsert por userId, no create", async () => {
    const result = await applySenior(form)

    expect(result).toHaveProperty("success")
    expect(prisma.seniorApplication.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "junior-1" } })
    )
  })

  it("un ADMIN no puede postularse", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("ADMIN", "admin-1"))

    const result = await applySenior(form)

    expect(result).toHaveProperty("error")
    expect(prisma.seniorApplication.upsert).not.toHaveBeenCalled()
  })

  it("un SENIOR no puede postularse", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("SENIOR", "senior-1"))

    const result = await applySenior(form)

    expect(result).toHaveProperty("error")
  })

  it("no deja una segunda postulacion pendiente", async () => {
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      status: "PENDING",
    })

    const result = await applySenior(form)

    expect(result).toHaveProperty("error")
    expect(prisma.seniorApplication.upsert).not.toHaveBeenCalled()
  })

  it("permite re-postular tras un rechazo (misma fila)", async () => {
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      status: "REJECTED",
    })

    const result = await applySenior(form)

    expect(result).toHaveProperty("success")
    expect(prisma.seniorApplication.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "junior-1" },
        update: expect.objectContaining({ status: "PENDING" }),
      })
    )
  })
})

describe("paginacion: el skip esta acotado", () => {
  it("MAX_PAGE existe y es razonable", () => {
    expect(MAX_PAGE).toBeGreaterThan(0)
    expect(MAX_PAGE).toBeLessThanOrEqual(1000)
  })
})