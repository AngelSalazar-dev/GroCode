/**
 * Session cookie names.
 *
 * NextAuth v5 renamed `next-auth.session-token` to `authjs.session-token`
 * (`@auth/core/lib/utils/cookie.js`). Checking the v4 name means the proxy
 * never sees a session, so every private route redirects to sign-in even after
 * a successful login.
 *
 * `__Secure-` is prefixed when the deployment is served over HTTPS.
 */
export const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const

export function hasSessionCookie(cookies: {
  has: (name: string) => boolean
}): boolean {
  return SESSION_COOKIE_NAMES.some((name) => cookies.has(name))
}