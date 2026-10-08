import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    follow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    notification: { create: vi.fn() },
    seniorApplication: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockSession = (role: string | undefined, id = "viewer-1") => {
  if (!role) return null
  return { user: { id, role } }
}

vi.mock("@/auth/auth", () => ({ auth: vi.fn() }))
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.7" })),
}))
vi.mock("@/lib/notifications", () => ({ notify: vi.fn(async () => null) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const { auth } = await import("@/auth/auth")
const { prisma } = await import("@/lib/prisma")
const { toggleFollow } = await import("@/actions/follow")
const { reviewSeniorApplication, listSeniorApplications, setUserRole } = await import(
  "@/actions/admin"
)

describe("toggleFollow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR"))
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ id: "target-1", name: "Ana" })
    ;(prisma.follow.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.follow.create as Mock).mockResolvedValue({})
  })

  it("crea el follow y notifica cuando no existía", async () => {
    const result = await toggleFollow("target-1")

    expect(result).toEqual({ following: true })
    expect(prisma.follow.create).toHaveBeenCalledWith({
      data: { followerId: "viewer-1", followingId: "target-1" },
    })
  })

  it("elimina el follow cuando ya existía", async () => {
    ;(prisma.follow.findUnique as Mock).mockResolvedValue({ followerId: "viewer-1" })

    const result = await toggleFollow("target-1")

    expect(result).toEqual({ following: false })
    expect(prisma.follow.delete).toHaveBeenCalledWith({
      where: {
        followerId_followingId: { followerId: "viewer-1", followingId: "target-1" },
      },
    })
  })

  it("rechaza seguirse a sí mismo", async () => {
    const result = await toggleFollow("viewer-1")

    expect(result).toHaveProperty("error")
    expect(prisma.follow.create).not.toHaveBeenCalled()
  })

  it("requiere sesión", async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await toggleFollow("target-1")

    expect(result).toEqual({ error: "No autorizado" })
  })

  it("falla si el usuario objetivo no existe", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue(null)

    const result = await toggleFollow("ghost")

    expect(result).toEqual({ error: "Usuario no encontrado" })
  })
})

describe("admin: guard de permisos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      userId: "candidate-1",
      status: "VERIFIED",
    })
    ;(prisma.$transaction as Mock).mockResolvedValue([])
  })

  it("reviewSeniorApplication rechaza a un JUNIOR", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR"))

    await expect(reviewSeniorApplication("app-1", "APPROVED")).rejects.toThrow(
      /permisos de administrador/i
    )
    expect(prisma.seniorApplication.update).not.toHaveBeenCalled()
  })

  it("reviewSeniorApplication rechaza a un SENIOR", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("SENIOR"))

    await expect(reviewSeniorApplication("app-1", "APPROVED")).rejects.toThrow(
      /permisos de administrador/i
    )
  })

  it("reviewSeniorApplication rechaza sin sesión", async () => {
    ;(auth as Mock).mockResolvedValue(null)

    await expect(reviewSeniorApplication("app-1", "APPROVED")).rejects.toThrow(
      /No autorizado/i
    )
  })

  it("listSeniorApplications rechaza a un no-admin", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR"))

    await expect(listSeniorApplications()).rejects.toThrow(/permisos de administrador/i)
    expect(prisma.seniorApplication.findMany).not.toHaveBeenCalled()
  })

  it("setUserRole rechaza a un no-admin", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("SENIOR"))

    await expect(setUserRole("someone", "ADMIN")).rejects.toThrow(
      /permisos de administrador/i
    )
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

describe("admin: flujo de aprobación", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as Mock).mockResolvedValue(mockSession("ADMIN", "admin-1"))
    ;(prisma.$transaction as Mock).mockResolvedValue([])
    ;(prisma.user.update as Mock).mockResolvedValue({})
  })

  it("no permite aprobar sin verificar antes", async () => {
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      userId: "candidate-1",
      status: "PENDING",
    })

    const result = await reviewSeniorApplication("app-1", "APPROVED")

    expect(result).toEqual({ error: "Verifica la postulación antes de aprobarla" })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("aprueba y promueve a SENIOR en una transacción", async () => {
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      userId: "candidate-1",
      status: "VERIFIED",
    })

    const result = await reviewSeniorApplication("app-1", "APPROVED")

    expect(result).toEqual({ success: true, status: "APPROVED" })
    expect(prisma.$transaction).toHaveBeenCalledOnce()

    const [ops] = (prisma.$transaction as Mock).mock.calls[0]
    expect(ops).toHaveLength(2)

    // Assert on the call arguments: the array holds the return values, which
    // are Promises for mocked Prisma methods.
    expect(prisma.seniorApplication.update).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: { status: "APPROVED", reviewedAt: expect.any(Date) },
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "candidate-1" },
      data: { role: "SENIOR" },
    })
  })

  it("rechazar no toca el rol del usuario", async () => {
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      userId: "candidate-1",
      status: "PENDING",
    })

    await reviewSeniorApplication("app-1", "REJECTED")

    const [ops] = (prisma.$transaction as Mock).mock.calls[0]
    expect(ops).toHaveLength(1)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("no revierte una postulación ya resuelta", async () => {
    ;(prisma.seniorApplication.findUnique as Mock).mockResolvedValue({
      id: "app-1",
      userId: "candidate-1",
      status: "APPROVED",
    })

    const result = await reviewSeniorApplication("app-1", "REJECTED")

    expect(result).toHaveProperty("error")
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("impide quedarse sin administradores", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ id: "other", role: "ADMIN" })
    ;(prisma.user.count as Mock).mockResolvedValue(1)

    const result = await setUserRole("other", "SENIOR")

    expect(result).toEqual({ error: "Debe quedar al menos un administrador" })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("no permite cambiar el propio rol", async () => {
    const result = await setUserRole("admin-1", "SENIOR")

    expect(result).toEqual({ error: "No puedes cambiar tu propio rol" })
  })
})