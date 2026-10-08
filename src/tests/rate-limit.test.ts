import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { limit, getClientIp, resetRateLimits } from "@/lib/rate-limit"

describe("rate-limit: contrato de la ventana deslizante", () => {
  beforeEach(() => resetRateLimits())
  afterEach(() => vi.useRealTimers())

  // The previous test only checked the last result of a loop, so a limit of 6
  // instead of 5 would still have passed. This pins the exact threshold.
  it("permite exactamente `max` intentos y bloquea el siguiente", () => {
    const MAX = 5
    for (let i = 0; i < MAX; i++) {
      expect(limit("k", MAX, 60_000).ok, `intento ${i + 1}`).toBe(true)
    }
    expect(limit("k", MAX, 60_000).ok).toBe(false)
  })

  it("informa del número de intentos restantes", () => {
    expect(limit("k", 3, 60_000).remaining).toBe(2)
    expect(limit("k", 3, 60_000).remaining).toBe(1)
    expect(limit("k", 3, 60_000).remaining).toBe(0)
    expect(limit("k", 3, 60_000).remaining).toBe(0) // ya bloqueado
  })

  it("devuelve retryAfter en segundos cuando bloquea", () => {
    for (let i = 0; i < 2; i++) limit("k", 1, 60_000)
    const blocked = limit("k", 1, 60_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
    expect(blocked.retryAfter).toBeLessThanOrEqual(60)
  })

  it("la ventana se renueva al expirar", () => {
    vi.useFakeTimers()
    const MAX = 2

    expect(limit("k", MAX, 1_000).ok).toBe(true)
    expect(limit("k", MAX, 1_000).ok).toBe(true)
    expect(limit("k", MAX, 1_000).ok).toBe(false)

    vi.advanceTimersByTime(1_100)

    expect(limit("k", MAX, 1_000).ok).toBe(true)
  })

  it("los buckets son independientes", () => {
    expect(limit("a", 1, 60_000).ok).toBe(true)
    expect(limit("a", 1, 60_000).ok).toBe(false)
    expect(limit("b", 1, 60_000).ok).toBe(true)
  })

  it("resetRateLimits limpia todo (uso de tests)", () => {
    limit("a", 1, 60_000)
    limit("a", 1, 60_000)
    expect(limit("a", 1, 60_000).ok).toBe(false)

    resetRateLimits()

    expect(limit("a", 1, 60_000).ok).toBe(true)
  })
})

describe("rate-limit: getClientIp", () => {
  it("prefiere x-vercel-forwarded-for, que no se puede falsificar", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.9",
      "x-forwarded-for": "1.1.1.1, 2.2.2.2",
    })
    expect(getClientIp(headers)).toBe("203.0.113.9")
  })

  it("usa x-real-ip cuando no hay header de Vercel", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4"
    )
  })

  it("toma la última IP de x-forwarded-for, no la primera", () => {
    // The first entry is client-supplied and trivially spoofed.
    const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.10" })
    expect(getClientIp(headers)).toBe("203.0.113.10")
  })

  it("no devuelve string vacío con un header presente pero vacío", () => {
    // With `??` an empty header yields "", and every misconfigured client
    // would collapse into one shared bucket.
    const headers = new Headers({ "x-vercel-forwarded-for": "" })
    expect(getClientIp(headers)).not.toBe("")
  })

  it("cae a 'unknown' sin ningún header", () => {
    expect(getClientIp(new Headers())).toBe("unknown")
  })
})