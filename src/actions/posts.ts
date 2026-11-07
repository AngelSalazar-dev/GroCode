"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { DEFAULT_CHANNEL, isValidChannel } from "@/lib/channels"
import { validateHttpUrl } from "@/lib/validation"
import { limit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const MAX_CONTENT = 5000
const MAX_URL = 500
// Keyed by user, not IP: an office or classroom shares one address.
const MAX_POSTS = 10
const POST_WINDOW_MS = 60 * 60 * 1000

export type PostResult = { error: string } | { success: true }

function validateURL(url: string) {
  // Shared with updateProfile: a bare `new URL()` accepts `javascript:`.
  return validateHttpUrl(url, { maxLength: MAX_URL })
}

export async function createPost(formData: FormData): Promise<PostResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }

  const gate = limit(`post:${session.user.id}`, MAX_POSTS, POST_WINDOW_MS)
  if (!gate.ok) {
    return {
      error: `Has alcanzado el límite de publicaciones. Inténtalo de nuevo en ${Math.ceil(gate.retryAfter / 60)} minutos.`,
    }
  }

  const rawContent = formData.get("content")
  const rawUrl = formData.get("resourceUrl")
  const rawChannel = formData.get("channel")

  const content = typeof rawContent === "string" ? rawContent.trim() : ""
  const resourceUrl = typeof rawUrl === "string" ? rawUrl.trim() : ""
  const channel = typeof rawChannel === "string" ? rawChannel : DEFAULT_CHANNEL

  if (content.length < 10) {
    return { error: "El contenido debe tener al menos 10 caracteres" }
  }
  if (content.length > MAX_CONTENT) {
    return { error: `El contenido no puede superar los ${MAX_CONTENT} caracteres` }
  }
  if (resourceUrl) {
    const check = validateURL(resourceUrl)
    if (!check.ok) return { error: `URL de recurso inválida: ${check.error}` }
  }
  if (!isValidChannel(channel)) {
    return { error: "Canal inválido" }
  }

  try {
    await prisma.post.create({
      data: {
        content,
        resourceUrl: resourceUrl || null,
        channel,
        authorId: session.user.id,
      },
    })
  } catch (error) {
    logger.error("createPost.failed", { error })
    return { error: "Error al crear el post, por favor intente nuevamente" }
  }

  // redirect() must stay OUTSIDE the try block: it throws NEXT_REDIRECT,
  // which the catch above would swallow and turn into a generic error.
  revalidatePath("/feed")
  redirect("/feed")
}
