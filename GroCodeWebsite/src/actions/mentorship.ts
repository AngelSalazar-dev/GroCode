"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createMentorshipRequest(seniorId: string, message?: string) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "JUNIOR") {
    throw new Error("Solo los Juniors pueden solicitar mentorías")
  }

  const juniorId = session.user.id

  if (juniorId === seniorId) {
    throw new Error("No puedes solicitarte mentoría a ti mismo")
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

  await prisma.mentorshipRequest.create({
    data: {
      juniorId,
      seniorId,
      message,
      status: "PENDING"
    }
  })

  revalidatePath(`/profile/${seniorId}`)
}
