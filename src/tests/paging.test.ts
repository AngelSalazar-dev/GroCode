import { describe, it, expect } from "vitest"
import { parsePage, MAX_PAGE } from "@/lib/paging"

describe("parsePage", () => {
  it("acepta paginas validas", () => {
    expect(parsePage("1")).toBe(1)
    expect(parsePage("7")).toBe(7)
    expect(parsePage("42")).toBe(42)
  })

  it("por defecto es la primera pagina", () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage("")).toBe(1)
  })

  // The original bug: parseInt("abc") is NaN and a NaN skip makes Prisma throw.
  it("cae a 1 con basura en vez de propagar NaN", () => {
    for (const bad of ["abc", "NaN", "undefined", "null", "1; DROP TABLE", " "]) {
      const page = parsePage(bad)
      expect(Number.isSafeInteger(page), `"${bad}"`).toBe(true)
      expect(page, `"${bad}"`).toBeGreaterThanOrEqual(1)
    }
  })

  it("rechaza negativos y cero", () => {
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-5")).toBe(1)
  })

  // DoS amplifier: an unbounded page becomes a huge OFFSET the DB must walk.
  it("acota el skip con un page enorme", () => {
    const huge = parsePage("100000000")
    expect(huge).toBe(MAX_PAGE)
    expect(huge).toBeLessThanOrEqual(MAX_PAGE)
  })

  it("descarta decimales y notacion cientifica", () => {
    expect(parsePage("3.7")).toBe(3)
    expect(parsePage("1e5")).toBe(1)
  })

  it("no produce valores que rompan Prisma", () => {
    for (const raw of ["abc", "1e5", "-1", "0", "99999999999999999999"]) {
      const page = parsePage(raw)
      expect(Number.isSafeInteger(page), raw).toBe(true)
      expect(page).toBeGreaterThanOrEqual(1)
      expect((page - 1) * 10).toBeLessThanOrEqual(MAX_PAGE * 10)
    }
  })
})