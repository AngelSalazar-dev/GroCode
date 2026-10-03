"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const maxLengths = {
  name: 100,
  bio: 2000,
  location: 200,
  website: 200,
}

const validateWebsite = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function updateProfile(data: {
  name: string
  bio: string
  location: string
  website: string
  image?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  if (data.name.trim().length === 0 || data.name.trim().length > maxLengths.name) {
    throw new Error(`Nombre debe tener entre 1 y ${maxLengths.name} caracteres`)
  }

  if (data.bio.length > maxLengths.bio) {
    throw new Error(`Bio muy larga. Máximo ${maxLengths.bio} caracteres`)
  }

  if (data.website && !validateWebsite(data.website)) {
    throw new Error("URL de sitio web inválida")
  }

  if (data.location.length > maxLengths.location) {
    throw new Error(`Ubicación muy larga. Máximo ${maxLengths.location} caracteres`)
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name.trim(),
        bio: data.bio,
        location: data.location,
        website: data.website || null,
        image: data.image || undefined,
      },
    })

    revalidatePath(`/profile/${session.user.id}`)
    revalidatePath("/feed")
    revalidatePath("/mentors")
  } catch (error) {
    console.error("Error en updateProfile:", error)
    throw new Error("Error al actualizar el perfil, por favor intente nuevamente")
  }
}
