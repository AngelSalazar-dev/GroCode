"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface SeniorApplicationFormData {
  years: string
  tech: string
  github: string
  linkedin: string
  motivation: string
}

export async function applySenior(form: SeniorApplicationFormData) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  try {
    // Validate required fields
    if (!form.years) {
      throw new Error("Selecciona tus años de experiencia")
    }

    if (!form.tech.trim()) {
      throw new Error("Indica tus tecnologías")
    }

    if (!form.github.trim()) {
      throw new Error("Tu perfil de GitHub es necesario para la verificación")
    }

    if (!form.motivation.trim() || form.motivation.trim().length < 50) {
      throw new Error("La motivación debe tener al menos 50 caracteres")
    }

    // Create the application in the database
    await prisma.seniorApplication.create({
      data: {
        userId: session.user.id,
        yearsOfExperience: form.years,
        technologies: form.tech,
        githubProfile: form.github,
        linkedinProfile: form.linkedin || null,
        motivation: form.motivation,
        status: "PENDING"
      }
    })

    revalidatePath("/apply-senior")
    return { success: true }
  } catch (error) {
    console.error("Error en applySenior:", error)
    return { error: error instanceof Error ? error.message : "Error al procesar la postulación" }
  }
}