"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@/generated-v2/client"
import { logger } from "@/lib/logger"

/**
 * Self-service role selection during onboarding.
 *
 * SECURITY: only JUNIOR may be self-assigned. Promoting to SENIOR is not a
 * user-facing action — it must go through an approved `SeniorApplication`,
 * reviewed from /admin. Previously this action accepted any role, which let
 * anyone claim Senior and appear in `/mentors`.
 */
export async function setOnboardingRole() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, onboardingCompleted: true },
    })

    if (!existing) {
      throw new Error("Usuario no encontrado")
    }

    // Never downgrade a role that was granted through the review process.
    if (existing.role !== Role.JUNIOR) {
      return { role: existing.role }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: Role.JUNIOR, onboardingCompleted: true },
    })

    revalidatePath("/")
    return { role: Role.JUNIOR }
  } catch (error) {
    logger.error("setOnboardingRole.failed", { error })
    throw new Error("Error al guardar tu rol, por favor intente nuevamente")
  }
}