import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.7" })),
}))

// The suite exercises validation and rate limiting, not key derivation.
// bcrypt at cost 12 would add seconds of pure CPU per call.
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(async (value: string) => `hashed:${value}`) },
}))

const { prisma } = await import("@/lib/prisma")
const { registerUser } = await import("@/actions/register")
const { resetRateLimits } = await import("@/lib/rate-limit")

const createMockFormData = (data: Record<string, string>) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

const validForm = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
}

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    ;(prisma.user.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.user.create as Mock).mockResolvedValue({ id: "test-id" })
  })

  it("registra un usuario exitosamente", async () => {
    const result = await registerUser(createMockFormData(validForm))

    expect(result).toEqual({ success: true })
    expect(prisma.user.create).toHaveBeenCalledOnce()
  })

  it("normaliza el email a minúsculas", async () => {
    await registerUser(createMockFormData({ ...validForm, email: "  Test@Example.COM " }))

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "test@example.com" } }),
    )
  })

  it("guarda la contraseña hasheada, nunca en claro", async () => {
    await registerUser(createMockFormData(validForm))

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: "hashed:password123",
      },
    })
  })

  it("falla si el email ya está registrado", async () => {
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ id: "existing-id" })

    const result = await registerUser(createMockFormData(validForm))

    expect(result).toEqual({ error: "El email ya está registrado" })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("falla si falta el nombre", async () => {
    const result = await registerUser(createMockFormData({ ...validForm, name: "" }))

    expect(result).toEqual({ error: "El nombre es obligatorio" })
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("falla con email inválido", async () => {
    const result = await registerUser(createMockFormData({ ...validForm, email: "invalid-email" }))

    expect(result).toEqual({ error: "Email inválido" })
  })

  it("falla si la contraseña es demasiado corta", async () => {
    const result = await registerUser(createMockFormData({ ...validForm, password: "short" }))

    expect("error" in result && result.error).toMatch(/contraseña/i)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it("falla si se supera el límite de intentos", async () => {
    const results = []
    for (let i = 0; i < 7; i++) {
      results.push(await registerUser(createMockFormData({ ...validForm, email: `u${i}@e.com` })))
    }

    const last = results[results.length - 1] as { error: string }
    expect(String(last.error)).toMatch(/demasiados intentos/i)
  })
})
