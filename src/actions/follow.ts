"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { notify } from "@/lib/notifications"
import { limit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

// Keyed by user: following is a per-account action, not a per-IP one.
const MAX_FOLLOWS = 60
const WINDOW_MS = 60 * 60 * 1000

export type FollowResult = { following: boolean } | { error: string }

/**
 * Follow / unfollow another user.
 *
 * Returns the resulting state so the client can settle its optimistic value
 * from the server's answer rather than assuming the toggle direction.
 */
export async function toggleFollow(targetUserId: string): Promise<FollowResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }

  const followerId = session.user.id

  const gate = limit(`follow:${followerId}`, MAX_FOLLOWS, WINDOW_MS)
  if (!gate.ok) {
    return {
      error: `Demasiadas acciones. Inténtalo de nuevo en ${Math.ceil(gate.retryAfter / 60)} minutos.`,
    }
  }

  if (typeof targetUserId !== "string" || targetUserId.length === 0) {
    return { error: "Usuario inválido" }
  }

  if (targetUserId === followerId) {
    return { error: "No puedes seguirte a ti mismo" }
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    })

    if (!target) {
      return { error: "Usuario no encontrado" }
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetUserId } },
      select: { followerId: true },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId: targetUserId } },
      })
    } else {
      await prisma.follow.create({
        data: { followerId, followingId: targetUserId },
      })

      await notify({
        type: "follow",
        content: `${session.user.name ?? "Alguien"} empezó a seguirte.`,
        link: `/profile/${followerId}`,
        userId: targetUserId,
        fromUserId: followerId,
      })
    }

    const following = !existing

    revalidatePath(`/profile/${targetUserId}`)
    revalidatePath(`/profile/${followerId}`)

    return { following }
  } catch (error) {
    logger.error("toggleFollow.failed", { error })
    return { error: "No se pudo actualizar la suscripción" }
  }
}