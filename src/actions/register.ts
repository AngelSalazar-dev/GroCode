"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getClientIp, limit } from "@/lib/rate-limit"

const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(254, "Email demasiado largo"),
  password: z
    .string()
    .min(8, "La contraseña debe tener mínimo 8 caracteres")
    .max(128, "La contraseña no puede superar los 128 caracteres"),
})

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

export type RegisterResult = { error: string } | { success: true }

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const ip = getClientIp(await headers())
  const gate = limit(`register:${ip}`, MAX_ATTEMPTS, WINDOW_MS)

  if (!gate.ok) {
    return {
      error: `Demasiados intentos. Inténtalo de nuevo en ${Math.ceil(gate.retryAfter / 60)} minutos.`,
    }
  }

  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { name, email, password } = parsed.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return { error: "El email ya está registrado" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    return { success: true }
  } catch (error) {
    console.error("Error en registerUser:", error)
    return { error: "Error al registrar usuario, por favor intente nuevamente" }
  }
}
