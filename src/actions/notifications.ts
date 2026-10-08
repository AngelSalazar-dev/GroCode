"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Read/mutate helpers exposed to the client.
 *
 * NOTE: `notify()` is intentionally NOT re-exported here — see
 * `src/lib/notifications.ts`. Anything exported from a `"use server"` module
 * is a public HTTP endpoint.
 */

export async function getNotifications(limit = 20) {
  const session = await auth()
  if (!session?.user?.id) return { notifications: [] }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      type: true,
      content: true,
      link: true,
      read: true,
      createdAt: true,
      fromUser: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
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

  // Scope the update to the caller's own rows so a guessed id cannot be used
  // to flip someone else's notification.
  const { count } = await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  })

  if (count === 0) return { error: "Notificación no encontrada" }

  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: { read: true },
  })

  revalidatePath("/notifications")
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const { count } = await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  })

  if (count === 0) return { error: "Notificación no encontrada" }

  revalidatePath("/notifications")
  return { success: true }
}
