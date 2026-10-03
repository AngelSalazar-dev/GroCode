"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const validateURL = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function createPost(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  const content = formData.get("content") as string
  const resourceUrl = formData.get("resourceUrl") as string
  const channel = (formData.get("channel") as string) || "general"

  if (!content || content.trim().length < 10) {
    throw new Error("El contenido debe tener al menos 10 caracteres")
  }

  if (resourceUrl && !validateURL(resourceUrl)) {
    throw new Error("URL de recurso inválida")
  }

  try {
    await prisma.post.create({
      data: {
        content: content.trim(),
        resourceUrl: resourceUrl ? resourceUrl.trim() : null,
        channel,
        authorId: session.user.id
      }
    })

    revalidatePath("/feed")
    redirect("/feed")
  } catch (error) {
    console.error("Error en createPost:", error)
    throw new Error("Error al crear el post, por favor intente nuevamente")
  }
}
