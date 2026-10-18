"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
}

export async function markAsRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })

  revalidatePath("/feed")
  revalidatePath("/notifications")
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  revalidatePath("/feed")
  revalidatePath("/notifications")
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  return prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })
}
