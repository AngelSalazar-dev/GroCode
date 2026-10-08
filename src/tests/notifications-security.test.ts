import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

/**
 * Locks in the IDOR defences on notifications.
 *
 * These actions use `updateMany`/`deleteMany` scoped by `userId` instead of
 * `update`/`delete` by id. That distinction is invisible in the return value —
 * both return success — so an "optimisation" to `update({ where: { id } })`
 * would silently open horizontal read/write across every account. These tests
 * exist to make that refactor fail.
 */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

const mockSession = (role: string | undefined, id = "viewer-1") =>
  role ? { user: { id, role } } : null

vi.mock("@/auth/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const { auth } = await import("@/auth/auth")
const { prisma } = await import("@/lib/prisma")
const { markAsRead, deleteNotification, markAllAsRead, getNotifications, getUnreadCount } =
  await import("@/actions/notifications")

describe("notifications: autorización", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(auth as Mock).mockResolvedValue(mockSession("JUNIOR"))
  })

  it("markAsRead incluye el userId del viewer en el filtro", async () => {
    ;(prisma.notification.updateMany as Mock).mockResolvedValue({ count: 1 })

    const result = await markAsRead("notif-mia")

    expect(result).toEqual({ success: true })
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif-mia", userId: "viewer-1" },
      data: { read: true },
    })
  })

  it("markAsRead no marca la notificación de otra persona", async () => {
    // count 0 = the row belonged to someone else.
    ;(prisma.notification.updateMany as Mock).mockResolvedValue({ count: 0 })

    const result = await markAsRead("notif-ajena")

    expect(result).toEqual({ error: "Notificación no encontrada" })
  })

  it("deleteNotification incluye el userId del viewer en el filtro", async () => {
    ;(prisma.notification.deleteMany as Mock).mockResolvedValue({ count: 1 })

    await deleteNotification("notif-mia")

    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: "notif-mia", userId: "viewer-1" },
    })
  })

  it("deleteNotification no borra la notificación de otra persona", async () => {
    ;(prisma.notification.deleteMany as Mock).mockResolvedValue({ count: 0 })

    const result = await deleteNotification("notif-ajena")

    expect(result).toEqual({ error: "Notificación no encontrada" })
  })

  it("markAsRead sin sesión no toca la base de datos", async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await markAsRead("notif-cualquiera")

    expect(result).toEqual({ error: "No autorizado" })
    expect(prisma.notification.updateMany).not.toHaveBeenCalled()
  })

  it("deleteNotification sin sesión no toca la base de datos", async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await deleteNotification("notif-cualquiera")

    expect(result).toEqual({ error: "No autorizado" })
    expect(prisma.notification.deleteMany).not.toHaveBeenCalled()
  })

  it("markAllAsRead solo afecta al viewer", async () => {
    ;(prisma.notification.updateMany as Mock).mockResolvedValue({ count: 3 })

    await markAllAsRead()

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "viewer-1", read: false },
      data: { read: true },
    })
  })

  it("getNotifications solo lee las del viewer", async () => {
    ;(prisma.notification.findMany as Mock).mockResolvedValue([])

    await getNotifications(10)

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "viewer-1" } })
    )
  })

  it("getNotifications acota el limit para no abusar", async () => {
    ;(prisma.notification.findMany as Mock).mockResolvedValue([])

    await getNotifications(9999)

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })

  it("getNotifications sin sesión devuelve vacío sin consultar", async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await getNotifications(10)

    expect(result).toEqual({ notifications: [] })
    expect(prisma.notification.findMany).not.toHaveBeenCalled()
  })

  it("getUnreadCount cuenta solo las del viewer", async () => {
    ;(prisma.notification.count as Mock).mockResolvedValue(4)

    const result = await getUnreadCount()

    expect(result).toEqual({ count: 4 })
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: "viewer-1", read: false },
    })
  })
})