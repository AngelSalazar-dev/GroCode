import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import authConfig from "@/auth/auth.config"
import { proxy } from "@/proxy"
import { SESSION_COOKIE_NAMES } from "@/lib/session-cookie"

/**
 * Regression tests for two bugs that made the app unusable for signed-in users.
 *
 * Neither needs a database: the NextAuth callbacks and the proxy are pure
 * functions, so the whole auth *chain* can be exercised in-process.
 */

const jwt = authConfig.callbacks?.jwt
const session = authConfig.callbacks?.session

if (!jwt || !session) {
  throw new Error("authConfig must define jwt and session callbacks")
}

const jwtFn = jwt as (args: unknown) => Promise<Record<string, unknown>>
const sessionFn = session as (args: unknown) => Promise<{
  user: { role?: string }
}>

describe("auth.config: la cadena de callbacks preserva el rol", () => {
  // The bug: isRole() compared against a hardcoded JUNIOR/SENIOR list, so ADMIN
  // never reached token.role and the session fell back to JUNIOR. That made
  // requireAdmin() always throw and /admin unreachable for real staff.
  for (const role of ["JUNIOR", "SENIOR", "ADMIN"] as const) {
    it(`propaga ${role} desde user hasta session`, async () => {
      const token = await jwtFn({ token: {}, user: { id: "u1", role } })
      expect(token.role).toBe(role)

      const result = await sessionFn({ session: { user: {} }, token })
      expect(result.user.role).toBe(role)
    })
  }

  it("cubre todos los miembros del enum Role", async () => {
    // If a member is ever added to the enum, this fails until the chain
    // handles it. Derived from Object.values, so it cannot drift.
    const { Role } = await import("@/generated-v2/client")

    for (const role of Object.values(Role)) {
      const token = await jwtFn({ token: {}, user: { id: "u1", role } })
      expect(token.role).toBe(role)
    }
  })

  it("degrada a JUNIOR si el token no trae role (fallback seguro)", async () => {
    const result = await sessionFn({
      session: { user: {} },
      token: { id: "u1" },
    })
    expect(result.user.role).toBe("JUNIOR")
  })

  it("degrada a JUNIOR si el token trae un role desconocido", async () => {
    const result = await sessionFn({
      session: { user: {} },
      token: { id: "u1", role: "SUPERADMIN" },
    })
    expect(result.user.role).toBe("JUNIOR")
  })

  it("ignora un role inválido al firmar el token", async () => {
    const token = await jwtFn({ token: {}, user: { id: "u1", role: "GOD" } })
    expect(token.role).toBeUndefined()
  })
})

describe("proxy: nombre de la cookie de sesión", () => {
  const req = (path: string, cookieNames: string[] = []) => {
    const headers = new Headers()
    for (const name of cookieNames) headers.append("cookie", `${name}=x`)
    return new NextRequest(new URL(path, "http://localhost:3000"), { headers })
  }

  // The bug: NextAuth v5 emits `authjs.session-token`, but the proxy checked
  // the v4 name `next-auth.session-token`, so it never saw a session and every
  // private route redirected to sign-in.
  for (const name of SESSION_COOKIE_NAMES) {
    it(`deja pasar una ruta privada con la cookie ${name}`, () => {
      const res = proxy(req("/feed", [name]))
      // NextResponse.next() has no Location header; a redirect does.
      expect(res.headers.get("location")).toBeNull()
    })
  }

  it("redirige a signin una ruta privada sin cookie", () => {
    const res = proxy(req("/feed"))
    expect(res.headers.get("location")).toContain("/auth/signin")
  })

  it("recuerda el destino original en callbackUrl", () => {
    const res = proxy(req("/roadmap"))
    expect(res.headers.get("location")).toContain("callbackUrl=%2Froadmap")
  })

  it("no acepta la cookie v4 (next-auth.session-token)", () => {
    // Guards against silently re-introducing the v4 name, which NextAuth v5
    // never sets. If this ever starts passing, the constant is wrong.
    const res = proxy(req("/feed", ["next-auth.session-token"]))
    expect(res.headers.get("location")).toContain("/auth/signin")
  })

  it("deja pasar las rutas públicas sin cookie", () => {
    for (const path of ["/", "/auth/signin", "/auth/register", "/mentors"]) {
      expect(proxy(req(path)).headers.get("location")).toBeNull()
    }
  })

  // The "Compartir" button hands out /post/<id>. If those gated, sharing a post
  // on WhatsApp would show a login wall and the sitemap would advertise URLs
  // that every crawler gets redirected away from.
  it("deja pasar /post/<id> sin cookie", () => {
    expect(proxy(req("/post/abc123")).headers.get("location")).toBeNull()
  })

  it("deja pasar /profile/<id> sin cookie", () => {
    expect(proxy(req("/profile/xyz789")).headers.get("location")).toBeNull()
  })

  it("no deja pasar rutas con prefijo parecido (evita bypass por prefix)", () => {
    const results = ["/posts/abc", "/profiles/abc", "/mentorship/abc"].map((p) => [
      p,
      proxy(req(p)).headers.get("location"),
    ])

    for (const [path, location] of results) {
      expect(location, `${path} debería redirigir`).toContain("/auth/signin")
    }
  })

  // Regression: the public-prefix helper was originally derived from
  // PUBLIC_PATHS, whose root entry "/" ends with a slash — so
  // `pathname.startsWith("/")` matched every route and nothing was gated.
  it("no deja pasar una ruta privada solo porque empieza por '/'", () => {
    for (const path of ["/feed", "/notifications", "/roadmap", "/onboarding", "/feed/new"]) {
      expect(proxy(req(path)).headers.get("location"), path).toContain("/auth/signin")
    }
  })

  it("trata los file handles como coincidencia exacta, no como prefijo", () => {
    expect(proxy(req("/robots.txt")).headers.get("location")).toBeNull()
    expect(proxy(req("/sitemap.xml")).headers.get("location")).toBeNull()
    // A file that merely starts with a known handle is not public.
    expect(proxy(req("/robots.txt.bak")).headers.get("location")).toContain("/auth/signin")
  })

  it("sigue gateando rutas personales", () => {
    const paths = ["/notifications", "/onboarding", "/admin/applications", "/feed/new"]
    const results = paths.map((p) => [p, proxy(req(p)).headers.get("location")])

    for (const [path, location] of results) {
      expect(location, `${path} debería redirigir`).toContain("/auth/signin")
    }
  })

  it("deja pasar robots.txt y sitemap.xml sin cookie", () => {
    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      expect(proxy(req(path)).headers.get("location")).toBeNull()
    }
  })

  it("expulsa de /auth/signin a /feed si ya hay sesión", () => {
    const res = proxy(req("/auth/signin", ["authjs.session-token"]))
    expect(res.headers.get("location")).toContain("/feed")
  })

  it("deja pasar /api/auth/* sin cookie", () => {
    expect(proxy(req("/api/auth/session")).headers.get("location")).toBeNull()
  })
})