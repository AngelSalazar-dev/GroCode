import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { create: vi.fn() } },
}))

const { prisma } = await import("@/lib/prisma")
const { notify } = await import("@/lib/notifications")
const { resetRateLimits } = await import("@/lib/rate-limit")
import type { NotificationType } from "@/lib/notifications"

const base = {
  type: "like" as NotificationType,
  content: "te gustó una publicación",
  userId: "destinatario",
  fromUserId: "emisor",
}

describe("notify: cota anti-spam", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    ;(prisma.notification.create as Mock).mockResolvedValue({ id: "n1" })
  })

  it("crea la notificación con normalidad", async () => {
    const result = await notify({ ...base, postId: "p1" })

    expect(result).toEqual({ id: "n1" })
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "like",
        userId: "destinatario",
        fromUserId: "emisor",
        postId: "p1",
      }),
      select: { id: true },
    })
  })

  it("nunca notifica a alguien de su propia acción", async () => {
    const result = await notify({ ...base, userId: "emisor" })

    expect(result).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  // Without this, a scripted loop over toggleFollow writes one row per call.
  it("corta en seco al superar el limite del emisor", async () => {
    const MAX = 30

    for (let i = 0; i < MAX; i++) {
      await notify({ ...base, userId: `victima-${i}` })
    }
    expect(prisma.notification.create).toHaveBeenCalledTimes(MAX)

    const overflow = await notify({ ...base, userId: "otra-victima" })

    expect(overflow).toBeNull()
    expect(prisma.notification.create).toHaveBeenCalledTimes(MAX)
  })

  it("el limite es por emisor, no por destinatario", async () => {
    for (let i = 0; i < 30; i++) await notify({ ...base, userId: "misma-victima" })
    await notify({ ...base, userId: "misma-victima" })

    const otroEmisor = await notify({
      ...base,
      fromUserId: "emisor-distinto",
      userId: "misma-victima",
    })

    // A second emitter still has its own budget.
    expect(prisma.notification.create).toHaveBeenCalledTimes(31)
    expect(otroEmisor).not.toBeNull()
  })

  it("un fallo de la BD no propaga el error a la acción que la originó", async () => {
    ;(prisma.notification.create as Mock).mockRejectedValue(new Error("deadlock"))
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await notify(base)

    expect(result).toBeNull()
    spy.mockRestore()
  })

  // Prisma error objects can carry the original query, which would put emails
  // and other PII in the logs.
  it("no vuelca el objeto de error completo en el log", async () => {
    const secret = "victima@example.com"
    ;(prisma.notification.create as Mock).mockRejectedValue(
      Object.assign(new Error("Query failed"), { meta: { query: `INSERT ... '${secret}'` } })
    )
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    await notify(base)

    const logged = spy.mock.calls.map((c) => JSON.stringify(c)).join(" ")
    expect(logged).not.toContain(secret)
    expect(logged).toContain("Query failed")

    spy.mockRestore()
  })
})