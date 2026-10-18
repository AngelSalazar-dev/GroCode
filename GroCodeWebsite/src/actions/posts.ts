"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createPost(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const content = formData.get("content") as string
  const resourceUrl = formData.get("resourceUrl") as string
  const channel = formData.get("channel") as string || "general"

  if (!content || content.length < 10) {
    throw new Error("El contenido debe tener al menos 10 caracteres")
  }

  await prisma.post.create({
    data: {
      content,
      resourceUrl: resourceUrl || null,
      channel,
      authorId: session.user.id
    }
  })

  revalidatePath("/feed")
  redirect("/feed")
}

export async function deletePost(postId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error("Publicación no encontrada")
  if (post.authorId !== session.user.id) throw new Error("No tienes permiso para eliminar esta publicación")

  await prisma.post.delete({ where: { id: postId } })

  revalidatePath("/feed")
  revalidatePath(`/profile/${session.user.id}`)
}

export async function updatePost(postId: string, content: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error("Publicación no encontrada")
  if (post.authorId !== session.user.id) throw new Error("No tienes permiso para editar esta publicación")

  if (!content || content.length < 10) {
    throw new Error("El contenido debe tener al menos 10 caracteres")
  }

  await prisma.post.update({
    where: { id: postId },
    data: { content }
  })

  revalidatePath("/feed")
  revalidatePath(`/profile/${session.user.id}`)
}
