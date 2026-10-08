"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { getClientIp, limit } from "@/lib/rate-limit"
import { ApplicationStatus } from "@/generated-v2/client"
import {
  GITHUB_HOSTS,
  LINKEDIN_HOSTS,
  validateUrlWithHost,
} from "@/lib/validation"

const ApplicationSchema = z.object({
  years: z.enum(["3-5", "5-8", "8-12", "12+"], {
    message: "Selecciona tus años de experiencia",
  }),
  tech: z.string().trim().min(2, "Indica tus tecnologías").max(500),
  github: z
    .string()
    .trim()
    .max(300)
    // Exact host match: a regex with `includes`-style matching would also
    // accept `https://github.com.evil.example/` and `https://evil.example/github.com`.
    .refine((v) => validateUrlWithHost(v, GITHUB_HOSTS).ok, {
      message: "Introduce la URL de tu perfil de GitHub (https://github.com/tu-usuario)",
    }),
  linkedin: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || validateUrlWithHost(v, LINKEDIN_HOSTS).ok, {
      message: "Introduce la URL de tu perfil de LinkedIn",
    }),
  motivation: z
    .string()
    .trim()
    .min(50, "La motivación debe tener al menos 50 caracteres")
    .max(2000, "La motivación es demasiado larga"),
})

const MAX_ATTEMPTS = 3
const WINDOW_MS = 60 * 60 * 1000

export interface SeniorApplicationForm {
  years: string
  tech: string
  github: string
  linkedin: string
  motivation: string
}

export type ApplySeniorResult =
  | { success: true; status: ApplicationStatus }
  | { error: string }

/** Allow re-applying after a rejection, otherwise report the current status. */
export async function getMySeniorApplication() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.seniorApplication.findFirst({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
      yearsOfExperience: true,
      technologies: true,
      githubProfile: true,
      linkedinProfile: true,
      motivation: true,
      createdAt: true,
      reviewedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function applySenior(
  form: SeniorApplicationForm
): Promise<ApplySeniorResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }

  const gate = limit(`apply-senior:${getClientIp(await headers())}`, MAX_ATTEMPTS, WINDOW_MS)
  if (!gate.ok) {
    return {
      error: `Has enviado demasiadas postulaciones. Inténtalo en ${Math.ceil(gate.retryAfter / 60)} minutos.`,
    }
  }

  const parsed = ApplicationSchema.safeParse(form)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario" }
  }

  const data = parsed.data

  try {
    // Seniors and staff do not need to apply.
    if (session.user.role === "SENIOR" || session.user.role === "ADMIN") {
      return { error: "Ya tienes un rol avanzado" }
    }

    const existing = await prisma.seniorApplication.findUnique({
      where: { userId: session.user.id },
      select: { id: true, status: true },
    })

    if (existing && existing.status !== ApplicationStatus.REJECTED) {
      return {
        error: `Ya tienes una postulación en estado ${existing.status.toLowerCase()}`,
      }
    }

    const payload = {
      yearsOfExperience: data.years,
      technologies: data.tech,
      githubProfile: data.github,
      linkedinProfile: data.linkedin || null,
      motivation: data.motivation,
      status: ApplicationStatus.PENDING,
      reviewedAt: null,
    }

    // `userId` is UNIQUE, so this upsert cannot produce a second PENDING row.
    // Re-applying after a rejection reuses the same row.
    const application = await prisma.seniorApplication.upsert({
      where: { userId: session.user.id },
      create: { ...payload, userId: session.user.id },
      update: payload,
      select: { status: true },
    })

    revalidatePath("/apply-senior")
    return { success: true, status: application.status }
  } catch (error) {
    console.error("Error en applySenior:", error)
    return { error: "Error al procesar la postulación, inténtalo de nuevo" }
  }
}