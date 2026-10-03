"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return re.test(email)
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || name.trim().length === 0) return { error: "El nombre es obligatorio" }
  if (!email || !validateEmail(email)) return { error: "Email inválido" }
  if (!password || password.trim().length < 6) return { error: "Password debe tener mínimo 6 caracteres" }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) return { error: "El email ya está registrado" }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Error en registerUser:", error)
    return { error: "Error al registrar usuario, por favor intente nuevamente" }
  }
}
