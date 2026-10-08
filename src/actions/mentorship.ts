"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { notify } from "@/lib/notifications"
import { RequestStatus } from "@/generated-v2/client"

const MAX_MESSAGE_LENGTH = 500

export type MentorRequestOutcome = { error: string } | { status: RequestStatus }

export async function createMentorshipRequest(
  seniorId: string,
  message?: string
): Promise<MentorRequestOutcome> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }
  if (session.user.role !== "JUNIOR") {
    return { error: "Solo los Juniors pueden solicitar mentorías" }
  }

  const juniorId = session.user.id

  if (juniorId === seniorId) {
    return { error: "No puedes solicitarte mentoría a ti mismo" }
  }

  if (message && message.trim().length > MAX_MESSAGE_LENGTH) {
    return { error: `El mensaje no debe exceder ${MAX_MESSAGE_LENGTH} caracteres` }
  }

  try {
    const seniorUser = await prisma.user.findUnique({
      where: { id: seniorId },
      select: { id: true, name: true, role: true },
    })

    if (!seniorUser) {
      return { error: "Usuario mentor no encontrado" }
    }
    if (seniorUser.role !== "SENIOR") {
      return { error: "El usuario seleccionado no tiene rol de Senior" }
    }

    const existing = await prisma.mentorshipRequest.findUnique({
      where: { juniorId_seniorId: { juniorId, seniorId } },
      select: { id: true, status: true },
    })

    // A rejected request may be sent again; a pending/accepted one may not.
    if (existing && existing.status !== RequestStatus.REJECTED) {
      return { error: "Ya tienes una solicitud activa con este mentor" }
    }

    const request = existing
      ? await prisma.mentorshipRequest.update({
          where: { id: existing.id },
          data: {
            status: RequestStatus.PENDING,
            message: message?.trim() || null,
            respondedAt: null,
          },
          select: { id: true, status: true },
        })
      : await prisma.mentorshipRequest.create({
          data: {
            juniorId,
            seniorId,
            message: message?.trim() || null,
            status: RequestStatus.PENDING,
          },
          select: { id: true, status: true },
        })

    await notify({
      type: "mentorship",
      content: `${session.user.name ?? "Un Junior"} te ha enviado una solicitud de mentoría.`,
      link: `/profile/${juniorId}`,
      userId: seniorId,
      fromUserId: juniorId,
    })

    revalidatePath(`/profile/${seniorId}`)
    revalidatePath(`/profile/${juniorId}`)

    return { status: request.status }
  } catch (error) {
    console.error("Error en createMentorshipRequest:", error)
    return { error: "Error al crear la solicitud de mentoría, por favor intente nuevamente" }
  }
}

/**
 * Accept or reject an incoming request. Only the addressed senior may respond.
 */
export async function respondToMentorshipRequest(
  requestId: string,
  accept: boolean
): Promise<MentorRequestOutcome> {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "No autorizado" }
  }

  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    select: { id: true, seniorId: true, juniorId: true, status: true },
  })

  if (!request) {
    return { error: "Solicitud no encontrada" }
  }
  if (request.seniorId !== session.user.id) {
    return { error: "No puedes responder a una solicitud que no es tuya" }
  }
  if (request.status !== RequestStatus.PENDING) {
    return { error: "Esta solicitud ya fue respondida" }
  }

  const nextStatus = accept ? RequestStatus.ACCEPTED : RequestStatus.REJECTED

  try {
    await prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: nextStatus, respondedAt: new Date() },
    })

    await notify({
      type: "mentorship",
      content: accept
        ? `${session.user.name ?? "Tu mentor"} aceptó tu solicitud de mentoría.`
        : `${session.user.name ?? "El mentor"} rechazó tu solicitud por ahora.`,
      link: `/profile/${request.seniorId}`,
      userId: request.juniorId,
      fromUserId: request.seniorId,
    })

    revalidatePath(`/profile/${request.seniorId}`)
    revalidatePath(`/profile/${request.juniorId}`)

    return { status: nextStatus }
  } catch (error) {
    console.error("Error en respondToMentorshipRequest:", error)
    return { error: "Error al responder la solicitud" }
  }
}
