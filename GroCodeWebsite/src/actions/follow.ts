"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleFollow(userId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  if (session.user.id === userId) throw new Error("No puedes seguirte a ti mismo")

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: userId,
      }
    }
  })

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        }
      }
    })
  } else {
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userId,
      }
    })

    await prisma.notification.create({
      data: {
        userId: userId,
        type: "follow",
        message: `${session.user.name || "Alguien"} comenzó a seguirte`,
        link: `/profile/${session.user.id}`,
      }
    })
  }

  revalidatePath(`/profile/${userId}`)
  revalidatePath(`/profile/${session.user.id}`)
}

export async function isFollowing(userId: string) {
  const session = await auth()
  if (!session?.user?.id) return false

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: userId,
      }
    }
  })

  return !!follow
}
