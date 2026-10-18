"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function handleMentorshipRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED') {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const request = await prisma.mentorshipRequest.findUnique({
    where: { id: requestId },
    include: { junior: true, senior: true }
  })

  if (!request || request.seniorId !== session.user.id) {
    throw new Error("No tienes permiso para gestionar esta solicitud")
  }

  await prisma.mentorshipRequest.update({
    where: { id: requestId },
    data: { status }
  })

  if (status === 'ACCEPTED') {
    // Create a chat channel between junior and senior
    await prisma.chatChannel.create({
      data: {
        users: {
          connect: [
            { id: request.juniorId },
            { id: request.seniorId }
          ]
        },
        messages: {
          create: {
            content: "¡Solicitud de mentoría aceptada! Ya pueden comenzar a conversar.",
            senderId: request.seniorId
          }
        }
      }
    })
  }

  revalidatePath(`/profile/${session.user.id}`)
}

export async function handleCollaborationRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED') {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const request = await prisma.collaborationRequest.findUnique({
    where: { id: requestId },
    include: { project: true }
  })

  if (!request || request.receiverId !== session.user.id) {
    throw new Error("No tienes permiso para gestionar esta solicitud")
  }

  await prisma.collaborationRequest.update({
    where: { id: requestId },
    data: { status }
  })

  if (status === 'ACCEPTED') {
    // Add user as collaborator to project
    await prisma.project.update({
      where: { id: request.projectId },
      data: {
        collaborators: {
          connect: { id: request.senderId }
        }
      }
    })

    // Create chat channel between collaborators
    await prisma.chatChannel.create({
      data: {
        users: {
          connect: [
            { id: request.senderId },
            { id: request.receiverId }
          ]
        },
        messages: {
          create: {
            content: `¡Solicitud de colaboración aceptada! Ya pueden trabajar juntos en "${request.project.title}".`,
            senderId: request.receiverId
          }
        }
      }
    })
  }

  revalidatePath(`/profile/${session.user.id}`)
}
