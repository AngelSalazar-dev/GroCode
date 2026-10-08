import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"
import {
  validateHttpUrl,
  validateUrlWithHost,
  isHttpUrl,
  GITHUB_HOSTS,
} from "@/lib/validation"

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: vi.fn() } },
}))

vi.mock("@/auth/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "u1" } })) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const { updateProfile } = await import("@/actions/profile")
const { prisma } = await import("@/lib/prisma")

describe("validateHttpUrl: el protocolo es la defensa", () => {
  // The bug: the profile action used a bare `new URL()`, which PARSES these
  // successfully. The string was stored and rendered as an href, so any
  // visitor to the profile executed it in GroCode's origin.
  const dangerous = [
    "javascript:alert(document.cookie)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)  ",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://evil.example/x",
  ]

  for (const payload of dangerous) {
    it(`rechaza ${payload.slice(0, 34)}`, () => {
      expect(validateHttpUrl(payload).ok).toBe(false)
      expect(isHttpUrl(payload)).toBe(false)
    })
  }

  const safe = [
    "https://example.com",
    "http://example.com",
    "https://sub.example.com/path?a=1#frag",
    "https://example.com:8443/x",
  ]

  for (const url of safe) {
    it(`acepta ${url}`, () => {
      expect(validateHttpUrl(url).ok).toBe(true)
    })
  }

  it("rechaza una URL con credenciales embebidas", () => {
    // Renders as a misleading link to grocode.com.
    expect(validateHttpUrl("https://grocode.com@evil.example/").ok).toBe(false)
  })

  it("aplica el límite de longitud", () => {
    const long = `https://example.com/${"a".repeat(600)}`
    expect(validateHttpUrl(long, { maxLength: 500 }).ok).toBe(false)
  })

  it("rechaza vacío y no-cadena", () => {
    expect(validateHttpUrl("").ok).toBe(false)
    expect(validateHttpUrl(undefined as unknown as string).ok).toBe(false)
  })
})

describe("validateUrlWithHost: coincidencia exacta de host", () => {
  it("acepta el host exacto", () => {
    expect(validateUrlWithHost("https://github.com/tu-usuario", GITHUB_HOSTS).ok).toBe(
      true
    )
    expect(validateUrlWithHost("https://www.github.com/tu-usuario", GITHUB_HOSTS).ok).toBe(
      true
    )
  })

  // A regex or an `includes()` check would accept these.
  const spoofs = [
    "https://github.com.evil.example/user",
    "https://evil.example/github.com/",
    "https://notgithub.com/user",
    "https://github.com.attacker.io/",
  ]

  for (const url of spoofs) {
    it(`rechaza el spoof ${url.slice(0, 40)}`, () => {
      expect(validateUrlWithHost(url, GITHUB_HOSTS).ok).toBe(false)
    })
  }
})

describe("updateProfile: XSS almacenado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(prisma.user.update as Mock).mockResolvedValue({})
  })

  const base = { name: "Ana", bio: "hola", location: "CDMX", website: "" }

  it("NO persiste una website con javascript:", async () => {
    const result = await updateProfile({
      ...base,
      website: "javascript:alert(document.cookie)",
    })

    expect(result).toHaveProperty("error")
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("NO persiste una website con data:", async () => {
    const result = await updateProfile({ ...base, website: "data:text/html,<script>" })

    expect(result).toHaveProperty("error")
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("persiste una website https válida", async () => {
    const result = await updateProfile({ ...base, website: "https://ana.dev" })

    expect(result).toEqual({ success: true })
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ website: "https://ana.dev" }),
      })
    )
  })

  it("guarda website como null cuando se borra", async () => {
    await updateProfile({ ...base, website: "" })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ website: null }) })
    )
  })

  it("NO persiste un avatar con javascript:", async () => {
    const result = await updateProfile({
      ...base,
      website: "https://ana.dev",
      image: "javascript:alert(1)",
    })

    expect(result).toHaveProperty("error")
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("no rompe con campos undefined (antes daba 500)", async () => {
    const result = await updateProfile({
      name: undefined as unknown as string,
      bio: undefined as unknown as string,
      location: undefined as unknown as string,
      website: undefined as unknown as string,
    })

    expect(result).toHaveProperty("error")
    expect(result).not.toHaveProperty("success")
  })

  it("exige nombre", async () => {
    const result = await updateProfile({ ...base, name: "   " })
    expect(result).toEqual({ error: "El nombre es obligatorio" })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("respeta el límite de la bio", async () => {
    const result = await updateProfile({ ...base, bio: "x".repeat(2001) })
    expect(result).toHaveProperty("error")
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("hace trim antes de medir", async () => {
    // 100 chars + 200 spaces should pass, not fail on length.
    const result = await updateProfile({ ...base, name: `  ${"a".repeat(100)}  ` })
    expect(result).toEqual({ success: true })
  })
})