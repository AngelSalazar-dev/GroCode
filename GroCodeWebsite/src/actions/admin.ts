"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@/generated-v4/client"

const FOUNDER_EMAIL = "angeluqui2017@gmail.com"

export async function updateUserRole(userId: string, role: Role) {
  const session = await auth()
  
  // Basic security check
  if (!session?.user?.email || (session.user.email !== FOUNDER_EMAIL && (session.user as any).role !== "ADMIN")) {
    throw new Error("No autorizado")
  }

  // Protect founder from any role changes
  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (targetUser?.email === FOUNDER_EMAIL) {
    throw new Error("No puedes cambiar el rol del fundador")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role }
  })

  revalidatePath("/admin")
}

export async function handleRequest(requestId: string, type: 'mentorship' | 'collaboration', status: 'ACCEPTED' | 'REJECTED') {
  const session = await auth()
  if (!session?.user?.email || (session.user.email !== FOUNDER_EMAIL && (session.user as any).role !== "ADMIN")) {
    throw new Error("No autorizado")
  }

  if (type === 'mentorship') {
    await prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status }
    })
  } else {
    await prisma.collaborationRequest.update({
      where: { id: requestId },
      data: { status }
    })
  }

  revalidatePath("/admin")
}
