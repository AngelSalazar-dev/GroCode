"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { revalidateMentors } from "@/lib/mentors"
import { validateHttpUrl } from "@/lib/validation"

const MAX_LENGTHS = {
  name: 100,
  bio: 2000,
  location: 200,
  website: 200,
} as const

export type UpdateProfileResult = { success: true } | { error: string }

export async function updateProfile(data: {
  name: string
  bio: string
  location: string
  website: string
  image?: string
}): Promise<UpdateProfileResult> {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  // Everything below is client-supplied: coerce before measuring, otherwise
  // `undefined.length` throws a 500 instead of returning a validation error.
  const name = typeof data.name === "string" ? data.name.trim() : ""
  const bio = typeof data.bio === "string" ? data.bio.trim() : ""
  const location = typeof data.location === "string" ? data.location.trim() : ""
  const website = typeof data.website === "string" ? data.website.trim() : ""

  if (name.length === 0) return { error: "El nombre es obligatorio" }
  if (name.length > MAX_LENGTHS.name) {
    return { error: `El nombre no puede superar los ${MAX_LENGTHS.name} caracteres` }
  }
  if (bio.length > MAX_LENGTHS.bio) {
    return { error: `La bio no puede superar los ${MAX_LENGTHS.bio} caracteres` }
  }
  if (location.length > MAX_LENGTHS.location) {
    return { error: `La ubicación no puede superar los ${MAX_LENGTHS.location} caracteres` }
  }

  let cleanWebsite: string | null = null
  if (website) {
    // `new URL()` alone accepted "javascript:...", which is then served as an
    // href to every visitor of this profile.
    const check = validateHttpUrl(website, { maxLength: MAX_LENGTHS.website })
    if (!check.ok) return { error: `Sitio web inválido: ${check.error}` }
    cleanWebsite = check.url
  }

  // `image` points at a DiceBear SVG chosen in the UI, but it is still client
  // input; anything that is not http(s) is refused rather than stored.
  let cleanImage: string | undefined
  if (data.image) {
    const check = validateHttpUrl(data.image, { maxLength: MAX_LENGTHS.website * 5 })
    if (!check.ok) return { error: "Avatar inválido" }
    cleanImage = check.url
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        bio,
        location,
        website: cleanWebsite,
        ...(cleanImage !== undefined ? { image: cleanImage } : {}),
      },
    })

    revalidatePath(`/profile/${session.user.id}`)
    revalidatePath("/feed")
    revalidatePath("/mentors")
    // Name, bio and location are shown in the directory and cached there;
    // `revalidatePath("/mentors")` alone would leave the old values in place.
    revalidateMentors()

    return { success: true }
  } catch (error) {
    console.error("Error en updateProfile:", error)
    return { error: "Error al actualizar el perfil, por favor intente nuevamente" }
  }
}