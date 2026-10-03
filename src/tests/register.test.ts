import { describe, it, expect, beforeEach, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { registerUser } from "@/actions/register"
import { bcrypt } from "bcryptjs"

// Mock del prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock de FormData
const createMockFormData = (data: Record<string, string>) => {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("debería registrar un usuario exitosamente", async () => {
    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)
    ;(prisma.user.create as vi.Mock).mockResolvedValue({
      id: "test-id",
      name: "Test User",
      email: "test@example.com",
      role: "JUNIOR",
    })

    const formData = createMockFormData({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    })

    const result = await registerUser(formData)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("debería fallar si el email ya está registrado", async () => {
    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
      id: "existing-id",
      email: "test@example.com",
    })

    const formData = createMockFormData({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    })

    const result = await registerUser(formData)

    expect(result.error).toBe("El email ya está registrado")
    expect(result.success).toBeUndefined()
  })

  it("debería fallar si faltan campos obligatorios", async () => {
    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

    const formData = createMockFormData({
      name: "",
      email: "",
      password: "",
    })

    const result = await registerUser(formData)

    expect(result.error).toBe("Faltan campos obligatorios")
    expect(result.success).toBeUndefined()
  })

  it("debería fallar con email inválido", async () => {
    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

    const formData = createMockFormData({
      name: "Test User",
      email: "invalid-email",
      password: "password123",
    })

    const result = await registerUser(formData)

    expect(result.error).toBe("Email inválido")
    expect(result.success).toBeUndefined()
  })

  it("debería fallar si la password es muy corta", async () => {
    ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

    const formData = createMockFormData({
      name: "Test User",
      email: "test@example.com",
      password: "short",
    })

    const result = await registerUser(formData)

    expect(result.error).toBe("Password debe tener mínimo 6 caracteres")
    expect(result.success).toBeUndefined()
  })
})