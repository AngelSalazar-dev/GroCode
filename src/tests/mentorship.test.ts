import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

/**
 * Mentorship is the product's core, and respondToMentorshipRequest was
 * unreachable because MentorRequestButton returned null before reaching its
 * branch. These tests pin the authorization rules of the response action.
 */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mentorshipRequest: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}))

const mockSession = (role: string | undefined, id = "viewer-1") =>
  role ? { user: { id, role } } : null

vi.mock("@/auth/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/notifications", () => ({ notify: vi.fn(async () => null) }))

const { auth } = await import("@/auth/auth")
const { prisma } = await import("@/lib/prisma")
const { createMentorshipRequest, respondToMentorshipRequest } = await import(
  "@/actions/mentorship"
)

describe("createMentorshipRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR"))
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      id: "senior-1",
      name: "Ana",
      role: "SENIOR",
    })
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.mentorshipRequest.create as Mock).mockResolvedValue({
      id: "req-1",
      status: "PENDING",
    })
  })

  it("crea la solicitud y notifica al senior", async () => {
    const result = await createMentorshipRequest("senior-1", "hola")

    expect(result).toEqual({ status: "PENDING" })
    expect(prisma.mentorshipRequest.create).toHaveBeenCalledWith({
      data: {
        juniorId: "viewer-1",
        seniorId: "senior-1",
        message: "hola",
        status: "PENDING",
      },
      select: { id: true, status: true },
    })
  })

  it("impide pedir mentoría a uno mismo", async () => {
    const result = await createMentorshipRequest("viewer-1")

    expect(result).toEqual({ error: "No puedes solicitarte mentoría a ti mismo" })
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })

  it("solo los juniors pueden solicitar", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("SENIOR"))

    const result = await createMentorshipRequest("senior-1")

    expect(result).toEqual({ error: "Solo los Juniors pueden solicitar mentorías" })
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })

  it("un admin tampoco puede solicitar mentoría", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("ADMIN"))

    const result = await createMentorshipRequest("senior-1")

    expect(result).toHaveProperty("error")
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })

  it("rechaza un objetivo que no es senior", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      id: "junior-2",
      name: "B",
      role: "JUNIOR",
    })

    const result = await createMentorshipRequest("junior-2")

    expect(result).toEqual({
      error: "El usuario seleccionado no tiene rol de Senior",
    })
  })

  it("no deja duplicar una solicitud pendiente", async () => {
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue({
      id: "req-old",
      status: "PENDING",
    })

    const result = await createMentorshipRequest("senior-1")

    expect(result).toEqual({
      error: "Ya tienes una solicitud activa con este mentor",
    })
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })

  it("no deja duplicar una solicitud ya aceptada", async () => {
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue({
      id: "req-old",
      status: "ACCEPTED",
    })

    const result = await createMentorshipRequest("senior-1")

    expect(result).toHaveProperty("error")
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })

  it("permite re-solicitar tras un rechazo (actualiza, no crea)", async () => {
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue({
      id: "req-old",
      status: "REJECTED",
    })
    ;(prisma.mentorshipRequest.update as Mock).mockResolvedValue({
      id: "req-old",
      status: "PENDING",
    })

    const result = await createMentorshipRequest("senior-1")

    expect(result).toEqual({ status: "PENDING" })
    expect(prisma.mentorshipRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "req-old" },
        data: expect.objectContaining({ status: "PENDING", respondedAt: null }),
      })
    )
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })

  it("valida la longitud del mensaje", async () => {
    const result = await createMentorshipRequest("senior-1", "x".repeat(501))

    expect(result).toHaveProperty("error")
    expect(prisma.mentorshipRequest.create).not.toHaveBeenCalled()
  })
})

describe("respondToMentorshipRequest: autorización", () => {
  const pending = {
    id: "req-1",
    seniorId: "senior-1",
    juniorId: "viewer-1",
    status: "PENDING",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as Mock).mockResolvedValue(mockSession("SENIOR", "senior-1"))
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue(pending)
    ;(prisma.mentorshipRequest.update as Mock).mockResolvedValue({})
  })

  it("el senior destinatario puede aceptar", async () => {
    const result = await respondToMentorshipRequest("req-1", true)

    expect(result).toEqual({ status: "ACCEPTED" })
    expect(prisma.mentorshipRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "ACCEPTED", respondedAt: expect.any(Date) },
    })
  })

  it("el senior destinatario puede rechazar", async () => {
    const result = await respondToMentorshipRequest("req-1", false)

    expect(result).toEqual({ status: "REJECTED" })
  })

  it("un tercero no puede responder", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("SENIOR", "otro-senior"))

    const result = await respondToMentorshipRequest("req-1", true)

    expect(result).toEqual({
      error: "No puedes responder a una solicitud que no es tuya",
    })
    expect(prisma.mentorshipRequest.update).not.toHaveBeenCalled()
  })

  it("el junior emisor no puede responder a su propia solicitud", async () => {
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR", "viewer-1"))

    const result = await respondToMentorshipRequest("req-1", true)

    expect(result).toHaveProperty("error")
    expect(prisma.mentorshipRequest.update).not.toHaveBeenCalled()
  })

  it("no se responde dos veces", async () => {
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue({
      ...pending,
      status: "ACCEPTED",
    })

    const result = await respondToMentorshipRequest("req-1", false)

    expect(result).toEqual({ error: "Esta solicitud ya fue respondida" })
    expect(prisma.mentorshipRequest.update).not.toHaveBeenCalled()
  })

  it("falla si la solicitud no existe", async () => {
    ;(prisma.mentorshipRequest.findUnique as Mock).mockResolvedValue(null)

    const result = await respondToMentorshipRequest("ghost", true)

    expect(result).toEqual({ error: "Solicitud no encontrada" })
  })

  it("requiere sesión", async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await respondToMentorshipRequest("req-1", true)

    expect(result).toEqual({ error: "No autorizado" })
    expect(prisma.mentorshipRequest.update).not.toHaveBeenCalled()
  })
})