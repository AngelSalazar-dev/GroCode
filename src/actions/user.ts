"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { Role } from "@/generated-v2/client"

const validRoles: Role[] = [Role.JUNIOR, Role.SENIOR]

export async function updateUserRole(role: Role) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("No autorizado")
  }

  if (!validRoles.includes(role)) {
    throw new Error("Rol inválido. Debe ser 'JUNIOR' o 'SENIOR'")
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role }
    })

    revalidatePath("/")
    redirect("/feed")
  } catch (error) {
    console.error("Error en updateUserRole:", error)
    throw new Error("Error al actualizar el rol, por favor intente nuevamente")
  }
}
