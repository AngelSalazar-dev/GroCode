"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { postAuthorSelect } from "@/lib/select"
import { notify } from "@/lib/notifications"
import { revalidatePath } from "next/cache"
import { ActionError } from "@/lib/action-error"

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

/** Feed and the author's profile are the only two views that render a post. */
function revalidatePostViews(post: { id: string; authorId: string }, actorId: string) {
  revalidatePath("/feed")
  revalidatePath(`/profile/${post.authorId}`)
  if (actorId !== post.authorId) revalidatePath(`/profile/${actorId}`)
}

export async function toggleLike(postId: string) {
  const user = await requireUser()

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
    console.error("Error en toggleLike:", error)
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
    console.error("Error en toggleBookmark:", error)
    throw error instanceof ActionError ? error : new ActionError("Error al cambiar bookmark")
  }
}

export async function addComment(postId: string, content: string) {
  const user = await requireUser()

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
    console.error("Error en addComment:", error)
    throw error instanceof ActionError ? error : new ActionError("Error al agregar comentario")
  }
}
