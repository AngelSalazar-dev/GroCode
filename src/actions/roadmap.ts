"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type ToggleProgressResult =
  | { success: true; completed: boolean }
  | { error: string }

/**
 * Mark a roadmap step as done / not done for the current user.
 * Toggles instead of setting, so the client only needs to send the step id.
 */
export async function toggleRoadmapStep(stepId: string): Promise<ToggleProgressResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }

  if (typeof stepId !== "string" || stepId.length === 0) {
    return { error: "Paso inválido" }
  }

  try {
    const step = await prisma.roadmapStep.findUnique({
      where: { id: stepId },
      select: { id: true },
    })

    if (!step) {
      return { error: "El paso no existe" }
    }

    const existing = await prisma.roadmapProgress.findUnique({
      where: { userId_stepId: { userId: session.user.id, stepId } },
      select: { completed: true },
    })

    const nextCompleted = !existing?.completed

    await prisma.roadmapProgress.upsert({
      where: { userId_stepId: { userId: session.user.id, stepId } },
      create: {
        userId: session.user.id,
        stepId,
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
      },
      update: {
        completed: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
      },
    })

    revalidatePath("/roadmap")
    return { success: true, completed: nextCompleted }
  } catch (error) {
    console.error("Error en toggleRoadmapStep:", error)
    return { error: "No se pudo actualizar tu progreso" }
  }
}