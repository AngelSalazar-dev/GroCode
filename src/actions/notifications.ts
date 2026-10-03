"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createNotification({
  type,
  content,
  link,
  userId,
  fromUserId,
  postId,
}: {
  type: string
  content: string
  link?: string
  userId: string
  fromUserId?: string
  postId?: string
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        content,
        link,
        userId,
        fromUserId,
        postId,
      },
    })
    return { notification }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { error: "Error al crear notificación" }
  }
}

export async function getNotifications(limit = 20) {
  const session = await auth()
  if (!session?.user?.id) return { notifications: [] }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      fromUser: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return { notifications }
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) return { count: 0 }

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  })

  return { count }
}

export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: { read: true },
    })

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { error: "Error al marcar notificación" }
  }
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    })

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return { error: "Error al marcar notificaciones" }
  }
}

export async function deleteNotification(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return { error: "Error al eliminar notificación" }
  }
}