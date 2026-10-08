/**
 * Input validation shared by the server actions.
 *
 * Kept out of any `"use server"` module: a `"use server"` export becomes a
 * public HTTP endpoint.
 */

const MAX_URL_LENGTH = 500

/** Discriminated result so callers must narrow on `ok`. */
export type UrlCheck = { ok: true; url: string } | { ok: false; error: string }

/**
 * Accepts only absolute http(s) URLs.
 *
 * `new URL()` alone is NOT enough: `new URL("javascript:alert(1)")` parses
 * successfully, and the string is then rendered as an `href`, which executes
 * in the origin of whoever opens the page. The protocol check is what makes
 * `javascript:`, `data:` and `vbscript:` invalid.
 */
export function validateHttpUrl(
  raw: string,
  { maxLength = MAX_URL_LENGTH }: { maxLength?: number } = {}
): UrlCheck {
  const value = typeof raw === "string" ? raw.trim() : ""

  if (value === "") return { ok: false, error: "La URL está vacía" }
  if (value.length > maxLength) {
    return { ok: false, error: `La URL no puede superar los ${maxLength} caracteres` }
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { ok: false, error: "URL inválida" }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "La URL debe empezar por http:// o https://" }
  }

  // Guard against credentials smuggled into the authority, which renders as a
  // misleading link: https://grocode.com@evil.example/
  if (parsed.username || parsed.password) {
    return { ok: false, error: "La URL no puede incluir credenciales" }
  }

  return { ok: true, url: value }
}

/** Convenience predicate for call sites that only need a boolean. */
export function isHttpUrl(raw: string): boolean {
  return validateHttpUrl(raw).ok
}

/**
 * Host must match exactly, ignoring a single leading `www.`.
 *
 * Normalising the prefix is safe because the comparison stays exact:
 * `github.com.evil.example` and `evil.example/github.com` both still fail.
 * String containment is what must never be used here.
 */
export function validateUrlWithHost(
  raw: string,
  allowedHosts: readonly string[]
): UrlCheck {
  const base = validateHttpUrl(raw)
  if (!base.ok) return base

  const hostname = new URL(base.url).hostname.toLowerCase()
  const host = hostname.startsWith("www.") ? hostname.slice(4) : hostname

  const allowed = allowedHosts.some(
    (candidate) => candidate.toLowerCase().replace(/^www\./, "") === host
  )

  if (!allowed) {
    return {
      ok: false,
      error: `El enlace debe apuntar a ${allowedHosts.join(" o ")}`,
    }
  }

  return { ok: true, url: base.url }
}

export const GITHUB_HOSTS = ["github.com"] as const
export const LINKEDIN_HOSTS = ["linkedin.com"] as const