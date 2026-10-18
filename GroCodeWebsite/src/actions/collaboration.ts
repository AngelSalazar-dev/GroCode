"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createCollaborationRequest(projectId: string, message?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true }
  })

  if (!project) throw new Error("Proyecto no encontrado")
  if (project.ownerId === session.user.id) throw new Error("No puedes postularte a tu propio proyecto")

  const alreadyCollaborator = project.collaborators.some(c => c.id === session.user.id)
  if (alreadyCollaborator) throw new Error("Ya eres colaborador de este proyecto")

  const existingRequest = await prisma.collaborationRequest.findUnique({
    where: { projectId_senderId: { projectId, senderId: session.user.id } }
  })

  if (existingRequest) throw new Error("Ya has enviado una solicitud para este proyecto")

  await prisma.collaborationRequest.create({
    data: {
      projectId,
      senderId: session.user.id,
      receiverId: project.ownerId,
      message: message || null,
    }
  })

  revalidatePath("/collaboration")
  revalidatePath(`/profile/${session.user.id}`)
}

export async function getCollaborationRequests() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.collaborationRequest.findMany({
    where: { receiverId: session.user.id, status: "PENDING" },
    include: { sender: true, project: true },
    orderBy: { createdAt: "desc" },
  })
}
