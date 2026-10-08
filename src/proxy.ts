import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasSessionCookie } from "@/lib/session-cookie"

/** Routes that are only for signed-out visitors. */
const AUTH_PATHS = new Set(["/auth/signin", "/auth/register"])

/** Routes reachable without a session, matched exactly. */
const PUBLIC_PATHS = new Set(["/", "/auth/signin", "/auth/register", "/mentors"])

/**
 * Route prefixes reachable without a session.
 *
 * /post and /profile are included because the "Compartir" button hands out
 * /post/<id> URLs: if those gated, sharing a post on WhatsApp would show a
 * login wall, and the sitemap would advertise URLs that every crawler gets
 * redirected away from.
 *
 * What a public profile exposes is bounded by `publicUserSelect`
 * (name, bio, location, website, image, role) — never email or password.
 */
const PUBLIC_PREFIXES = ["/post/", "/profile/"]

/**
 * Machine-readable files that must stay crawlable.
 * Not a prefix: "/robots.txt" must not match "/robots.txt.bak".
 */
const PUBLIC_FILE_HANDLES = new Set([
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true

  // Exact file handles: compare the whole first segment.
  const fileHandle = pathname.slice(1).split("/")[0]
  if (PUBLIC_FILE_HANDLES.has(fileHandle)) return true

  // Prefix match. Do NOT derive this from PUBLIC_PATHS: the root entry "/"
  // ends with a slash, so `pathname.startsWith("/")` would match everything.
return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request
  const { pathname } = nextUrl

  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  // Presence of the cookie, not its validity: this is only the first gate.
  // Anything sensitive re-validates the session server-side through auth().
  const isLoggedIn = hasSessionCookie(cookies)

  if (AUTH_PATHS.has(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/feed", nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicPath(pathname)) {
    // Remember where they were headed so sign-in can send them back.
    const signIn = new URL("/auth/signin", nextUrl)
    if (pathname !== "/") signIn.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signIn)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Everything except the framework internals, /api, and static assets.
    // .txt and .xml are NOT excluded here; they are whitelisted above by
    // PUBLIC_FILE_HANDLES so robots.txt and sitemap.xml stay reachable.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|mp4|webm|woff2?)$).*)",
  ],
}