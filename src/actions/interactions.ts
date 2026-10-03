"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const validatePostExists = async (postId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true }
  })
  return !!post
}

export async function toggleLike(postId: string) {
  const session = await auth()

  if (!session?.user?.id) throw new Error("No autorizado")

  try {
    const postExists = await validatePostExists(postId)
    if (!postExists) throw new Error("El post no existe")

    const userId = session.user.id

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
    } else {
      await prisma.like.create({ data: { userId, postId } })
    }

    revalidatePath("/feed")
    revalidatePath(`/profile/${userId}`)
  } catch (error) {
    console.error("Error en toggleLike:", error)
    throw error instanceof Error ? error : new Error("Error al cambiar like")
  }
}

export async function toggleBookmark(postId: string) {
  const session = await auth()

  if (!session?.user?.id) throw new Error("No autorizado")

  try {
    const postExists = await validatePostExists(postId)
    if (!postExists) throw new Error("El post no existe")

    const userId = session.user.id

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } })
    } else {
      await prisma.bookmark.create({ data: { userId, postId } })
    }

    revalidatePath("/feed")
    revalidatePath(`/profile/${userId}`)
  } catch (error) {
    console.error("Error en toggleBookmark:", error)
    throw error instanceof Error ? error : new Error("Error al cambiar bookmark")
  }
}

export async function addComment(postId: string, content: string) {
  const session = await auth()

  if (!session?.user?.id) throw new Error("No autorizado")

  try {
    const postExists = await validatePostExists(postId)
    if (!postExists) throw new Error("El post no existe")

    if (!content || content.trim().length === 0) {
      throw new Error("El contenido del comentario no puede estar vacío")
    }

    const userId = session.user.id

    await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        userId
      }
    })

    revalidatePath("/feed")
    revalidatePath(`/profile/${session.user.id}`)
  } catch (error) {
    console.error("Error en addComment:", error)
    throw error instanceof Error ? error : new Error("Error al agregar comentario")
  }
}
