"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { notify } from "@/lib/notifications"
import { ApplicationStatus, Role } from "@/generated-v2/client"
import { z } from "zod"

/**
 * Server Action arguments are client-controlled: the TypeScript type does not
 * exist at runtime. Passing "PENDING" used to slip past the guards, write a
 * corrupted state and then crash the notification insert on a null content.
 */
const DecisionSchema = z.enum(["VERIFIED", "APPROVED", "REJECTED"])
const RoleSchema = z.enum(["JUNIOR", "SENIOR", "ADMIN"] as [Role, ...Role[]])

/**
 * Every action in this module requires Role.ADMIN.
 *
 * Kept in a separate file from the user-facing actions so an accidental import
 * cannot reach a privileged code path from a client component.
 */
async function requireAdmin() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  if (session.user.role !== Role.ADMIN) {
    throw new Error("Requiere permisos de administrador")
  }

  return session.user
}

export type AdminResult =
  | { success: true; status: ApplicationStatus }
  | { error: string }

export interface AdminApplication {
  id: string
  status: ApplicationStatus
  yearsOfExperience: string | null
  technologies: string | null
  githubProfile: string | null
  linkedinProfile: string | null
  motivation: string | null
  /** ISO strings: Date objects do not survive the server/client boundary. */
  createdAt: string
  reviewedAt: string | null
  user: { id: string; name: string | null; email: string | null; role: Role; image: string | null }
}

/** True when the current visitor may see /admin. */
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.role === Role.ADMIN
}

export async function listSeniorApplications(
  status?: ApplicationStatus
): Promise<AdminApplication[]> {
  const session = await auth()
  if (session?.user?.role !== Role.ADMIN) {
    throw new Error("Requiere permisos de administrador")
  }

  const rows = await prisma.seniorApplication.findMany({
    where: status ? { status } : undefined,
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
      // email is exposed here on purpose: staff need to contact the applicant.
      user: { select: { id: true, name: true, email: true, role: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }))
}

/**
 * Two-step approval: staff first mark the profile as verified, then approve.
 * Approving directly is refused so the verification step cannot be skipped.
 */
export async function reviewSeniorApplication(
  applicationId: string,
  rawDecision: string
): Promise<AdminResult> {
  const admin = await requireAdmin()

  const decision = DecisionSchema.safeParse(rawDecision)
  if (!decision.success) {
    return { error: "Decisión inválida" }
  }

  const application = await prisma.seniorApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, userId: true, status: true },
  })

  if (!application) {
    return { error: "Postulación no encontrada" }
  }

  // A pending application can only be verified or rejected first.
  if (
    decision.data === ApplicationStatus.APPROVED &&
    application.status !== ApplicationStatus.VERIFIED
  ) {
    return { error: "Verifica la postulación antes de aprobarla" }
  }

  if (
    application.status !== ApplicationStatus.PENDING &&
    application.status !== ApplicationStatus.VERIFIED
  ) {
    return { error: "Esta postulación ya tiene un resultado final" }
  }

  try {
    await prisma.$transaction([
      prisma.seniorApplication.update({
        where: { id: applicationId },
        data: {
          status: decision.data,
          reviewedAt: new Date(),
        },
      }),
      // Promoting to SENIOR only happens on approval.
      ...(decision.data === ApplicationStatus.APPROVED
        ? [
            prisma.user.update({
              where: { id: application.userId },
              data: { role: Role.SENIOR },
            }),
          ]
        : []),
    ])

    const copy: Record<typeof decision.data, string> = {
      VERIFIED: "Tu perfil fue verificado. La aprobación final está en curso.",
      APPROVED: "¡Tu postulación como Senior fue aprobada! Ya tienes la insignia.",
      REJECTED: "Tu postulación como Senior no pudo aprobarse en esta revisión.",
    }

    await notify({
      type: "announcement",
      content: copy[decision.data],
      link: `/profile/${application.userId}`,
      userId: application.userId,
      fromUserId: admin.id,
    })

    revalidatePath("/admin/applications")
    revalidatePath("/mentors")

    return { success: true, status: decision.data }
  } catch (error) {
    console.error("Error en reviewSeniorApplication:", error)
    return { error: "No se pudo registrar la revisión" }
  }
}

/** Grant or revoke staff access. Only an ADMIN can call this. */
export async function setUserRole(
  userId: string,
  rawRole: string
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAdmin()

  const role = RoleSchema.safeParse(rawRole)
  if (!role.success) {
    return { error: "Rol inválido" }
  }

  if (admin.id === userId) {
    return { error: "No puedes cambiar tu propio rol" }
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!target) {
    return { error: "Usuario no encontrado" }
  }

  // Never leave the platform without at least one admin.
  if (target.role === Role.ADMIN && role.data !== Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } })
    if (adminCount <= 1) {
      return { error: "Debe quedar al menos un administrador" }
    }
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { role: role.data } })
    revalidatePath("/admin/applications")
    return { success: true }
  } catch (error) {
    console.error("Error en setUserRole:", error)
    return { error: "No se pudo actualizar el rol" }
  }
}