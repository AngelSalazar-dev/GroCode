"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const maxMessageLength = 500

export async function createMentorshipRequest(seniorId: string, message?: string) {
  const session = await auth()

  if (!session?.user || session.user.role !== "JUNIOR") {
    throw new Error("Solo los Juniors pueden solicitar mentorías")
  }

  const juniorId = session.user.id

  if (juniorId === seniorId) {
    throw new Error("No puedes solicitarte mentoría a ti mismo")
  }

  // Verificar que el senior existe y tiene rol SENIOR
  const seniorUser = await prisma.user.findUnique({
    where: { id: seniorId },
    select: { id: true, role: true }
  })

  if (!seniorUser) {
    throw new Error("Usuario mentor no encontrado")
  }

  if (seniorUser.role !== "SENIOR") {
    throw new Error("El usuario seleccionado no tiene rol de Senior")
  }

  // Verificar si ya existe una solicitud
  const existingRequest = await prisma.mentorshipRequest.findUnique({
    where: {
      juniorId_seniorId: { juniorId, seniorId }
    }
  })

  if (existingRequest) {
    throw new Error("Ya has enviado una solicitud a este mentor")
  }

  // Validar mensaje si se proporciona
  if (message && message.trim().length > maxMessageLength) {
    throw new Error(`El mensaje no debe exceder ${maxMessageLength} caracteres`)
  }

  try {
    await prisma.mentorshipRequest.create({
      data: {
        juniorId,
        seniorId,
        message: message ? message.trim() : null,
        status: "PENDING"
      }
    })

    revalidatePath(`/profile/${seniorId}`)
  } catch (error) {
    console.error("Error en createMentorshipRequest:", error)
    throw new Error("Error al crear la solicitud de mentoría, por favor intente nuevamente")
  }
}
