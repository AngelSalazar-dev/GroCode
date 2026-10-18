"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function applySenior(data: {
  experience: number
  githubUrl?: string
  linkedinUrl?: string
  techStack: string
  motivation: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const existingApplication = await prisma.seniorApplication.findUnique({
    where: { userId: session.user.id }
  })

  if (existingApplication) {
    throw new Error("Ya has enviado una solicitud anteriormente")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (user?.role === "SENIOR") {
    throw new Error("Ya eres un Senior verificado")
  }

  await prisma.seniorApplication.create({
    data: {
      userId: session.user.id,
      experience: data.experience,
      githubUrl: data.githubUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      techStack: data.techStack,
      motivation: data.motivation,
    }
  })

  revalidatePath("/apply-senior")
  revalidatePath(`/profile/${session.user.id}`)
}

export async function getSeniorApplication() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.seniorApplication.findUnique({
    where: { userId: session.user.id }
  })
}
