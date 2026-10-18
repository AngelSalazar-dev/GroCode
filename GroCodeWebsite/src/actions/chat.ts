"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getChatChannels() {
  const session = await auth()
  if (!session?.user?.id) return []

  const channels = await prisma.chatChannel.findMany({
    where: {
      users: { some: { id: session.user.id } }
    },
    include: {
      users: {
        select: { id: true, name: true, image: true, role: true }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: { select: { name: true } }
        }
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return channels
}

export async function getChatMessages(channelId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  const channel = await prisma.chatChannel.findFirst({
    where: {
      id: channelId,
      users: { some: { id: session.user.id } }
    }
  })

  if (!channel) throw new Error("Canal no encontrado")

  return prisma.chatMessage.findMany({
    where: { channelId },
    include: {
      sender: {
        select: { id: true, name: true, image: true }
      }
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function sendMessage(channelId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const channel = await prisma.chatChannel.findFirst({
    where: {
      id: channelId,
      users: { some: { id: session.user.id } }
    }
  })

  if (!channel) throw new Error("Canal no encontrado")

  const message = await prisma.chatMessage.create({
    data: {
      content,
      senderId: session.user.id,
      channelId,
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true }
      }
    }
  })

  await prisma.chatChannel.update({
    where: { id: channelId },
    data: { updatedAt: new Date() }
  })

  revalidatePath("/chat")
  return message
}
