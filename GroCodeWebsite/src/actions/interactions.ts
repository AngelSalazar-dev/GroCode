"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleLike(postId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

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
}

export async function toggleBookmark(postId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

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
}

export async function addComment(postId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  await prisma.comment.create({
    data: {
      content,
      postId,
      userId: session.user.id
    }
  })

  revalidatePath("/feed")
  revalidatePath(`/profile/${session.user.id}`)
}
