"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { postAuthorSelect } from "@/lib/select"
import { revalidatePost } from "@/lib/post-detail"
import { notify } from "@/lib/notifications"
import { revalidatePath } from "next/cache"
import { ActionError } from "@/lib/action-error"
import { limit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

// Keyed by user, never IP: a shared address would penalise a whole classroom.
const MAX_LIKES = 60
const MAX_COMMENTS = 20
const WINDOW_MS = 60 * 60 * 1000

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new ActionError("No autorizado")
  return session.user
}

async function requirePost(postId: string) {
  if (typeof postId !== "string" || postId.length === 0) {
    throw new ActionError("Post inválido")
  }
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  })
  if (!post) throw new ActionError("El post no existe")
  return post
}

/**
 * Feed, the post detail page and the author's profile all render this post.
 *
 * Every one of those reads the counts from the Data Cache now, so the tag has
 * to go with the paths: `revalidatePath` expires rendered HTML only, and
 * without `revalidatePost` a like would leave `/post/{id}` showing the old
 * number until the TTL ran out.
 */
function revalidatePostViews(post: { id: string; authorId: string }, actorId: string) {
  revalidatePost(post.id)
  revalidatePath("/feed")
  revalidatePath(`/profile/${post.authorId}`)
  if (actorId !== post.authorId) revalidatePath(`/profile/${actorId}`)
}

export async function toggleLike(postId: string) {
  const user = await requireUser()

  const gate = limit(`like:${user.id}`, MAX_LIKES, WINDOW_MS)
  if (!gate.ok) {
    throw new ActionError(`Demasiadas acciones. Inténtalo de nuevo en ${Math.ceil(gate.retryAfter / 60)} minutos.`)
  }

  try {
    const post = await requirePost(postId)

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
      select: { id: true },
    })

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
    } else {
      await prisma.like.create({ data: { userId: user.id, postId } })

      const authorName = user.name ?? "Alguien"
      await notify({
        type: "like",
        content: `${authorName} marcó con estrella tu publicación.`,
        link: `/post/${postId}`,
        userId: post.authorId,
        fromUserId: user.id,
        postId,
      })
    }

    revalidatePostViews(post, user.id)
    return { liked: !existing }
  } catch (error) {
    logger.error("toggleLike.failed", { error })
    throw error instanceof ActionError ? error : new ActionError("Error al cambiar like")
  }
}

export async function toggleBookmark(postId: string) {
  const user = await requireUser()

  try {
    const post = await requirePost(postId)

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
      select: { id: true },
    })

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } })
    } else {
      await prisma.bookmark.create({ data: { userId: user.id, postId } })
    }

    revalidatePostViews(post, user.id)
    return { bookmarked: !existing }
  } catch (error) {
    logger.error("toggleBookmark.failed", { error })
    throw error instanceof ActionError ? error : new ActionError("Error al cambiar bookmark")
  }
}

export async function addComment(postId: string, content: string) {
  const user = await requireUser()

  const gate = limit(`comment:${user.id}`, MAX_COMMENTS, WINDOW_MS)
  if (!gate.ok) {
    throw new ActionError(
      `Has alcanzado el límite de comentarios. Inténtalo de nuevo en ${Math.ceil(gate.retryAfter / 60)} minutos.`
    )
  }

  try {
    const post = await requirePost(postId)

    const trimmed = typeof content === "string" ? content.trim() : ""
    if (trimmed.length === 0) {
      throw new ActionError("El comentario no puede estar vacío")
    }
    if (trimmed.length > 1000) {
      throw new ActionError("El comentario no puede superar los 1000 caracteres")
    }

    const comment = await prisma.comment.create({
      data: { content: trimmed, postId, userId: user.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: postAuthorSelect },
      },
    })

    await notify({
      type: "comment",
      content: `${user.name ?? "Alguien"} comentó tu publicación.`,
      link: `/post/${postId}`,
      userId: post.authorId,
      fromUserId: user.id,
      postId,
    })

    revalidatePostViews(post, user.id)

    // Dates do not survive the server/client boundary; hand back a string.
    return { ...comment, createdAt: comment.createdAt.toISOString() }
  } catch (error) {
    logger.error("addComment.failed", { error })
    throw error instanceof ActionError ? error : new ActionError("Error al agregar comentario")
  }
}
