"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProject(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const skillsInput = formData.get("skills") as string // Comma separated

  if (!title || !description) throw new Error("Título y descripción son requeridos")

  const skillNames = skillsInput
    ? skillsInput.split(",").map(s => s.trim().toLowerCase()).filter(s => s !== "")
    : []

  const project = await prisma.project.create({
    data: {
      title,
      description,
      ownerId: session.user.id,
      skills: {
        connectOrCreate: skillNames.map(name => ({
          where: { name },
          create: { name }
        }))
      }
    }
  })

  revalidatePath("/collaboration")
  redirect("/collaboration")
}
