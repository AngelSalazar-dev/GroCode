import { describe, it, expect } from "vitest"
import {
  FILTER_OPTIONS,
  MAX_SEARCH_LENGTH,
  MENTORS_PER_PAGE,
  directoryUrl,
  isFilterId,
  isSortId,
  matchesFilter,
  matchesKeyword,
  matchesSearch,
  sortMentors,
} from "@/lib/mentor-filters"

describe("matchesKeyword", () => {
  // This is the whole reason the specialty filter was not moved into SQL:
  // `LIKE '%go%'` matches "amigo", "luego" and "algoritmos".
  it("matchea palabras completas y no subcadenas", () => {
    expect(matchesKeyword("Golang y Go", "go")).toBe(true)
    expect(matchesKeyword("Experiencia con Go", "go")).toBe(true)
    expect(matchesKeyword("optimizo algoritmos", "go")).toBe(false)
    expect(matchesKeyword("ayudo a mis amigos", "go")).toBe(false)
    expect(matchesKeyword("categorías de backend", "go")).toBe(false)
  })

  it("respeta puntuación como frontera", () => {
    expect(matchesKeyword("Experto en node.js", "node")).toBe(true)
    // Un alfanumérico pegado no es frontera: "nodejs" no matchea "node".
    expect(matchesKeyword("NodeJS en producción", "node")).toBe(false)
    expect(matchesKeyword("nodos distribuidos", "node")).toBe(false)
  })

  it("no distingue mayúsculas", () => {
    expect(matchesKeyword("REACT y next", "react")).toBe(true)
    expect(matchesKeyword("React Native", "react native")).toBe(true)
  })

  it("no interpreta metacaracteres de la keyword", () => {
    expect(matchesKeyword("ci/cd", "ci/cd")).toBe(true)
    // Un keyword con paréntesis no debe lanzar al construir la expresión.
    expect(() => matchesKeyword("algo (otro)", "(otro)")).not.toThrow()
  })
})

describe("matchesFilter", () => {
  const senior = (bio: string, name = "Ana Torres") => ({ bio, name })

  it('"all" acepta a cualquiera', () => {
    const all = FILTER_OPTIONS.find((option) => option.id === "all")!
    expect(matchesFilter(senior("nada que ver"), all)).toBe(true)
    expect(matchesFilter({ bio: null, name: null }, all)).toBe(true)
  })

  it("busca en bio y en nombre", () => {
    const frontend = FILTER_OPTIONS.find((option) => option.id === "frontend")!
    expect(matchesFilter(senior("React y Tailwind desde 2018"), frontend)).toBe(true)
    expect(matchesFilter({ bio: null, name: "Laura Vue" }, frontend)).toBe(true)
    expect(matchesFilter({ bio: null, name: null }, frontend)).toBe(false)
  })

  it("cada especialidad tiene keywords", () => {
    for (const option of FILTER_OPTIONS) {
      if (option.id === "all") continue
      expect(option.keywords.length, option.id).toBeGreaterThan(0)
    }
  })
})

describe("matchesSearch", () => {
  const mentor = {
    name: "María López",
    bio: "Especialista en Kubernetes",
    location: "Madrid, España",
  }

  it("consulta vacía no filtra", () => {
    expect(matchesSearch(mentor, "")).toBe(true)
    expect(matchesSearch(mentor, "   ")).toBe(true)
  })

  it("busca en nombre, bio y ubicación sin distinguir mayúsculas", () => {
    expect(matchesSearch(mentor, "maría")).toBe(true)
    expect(matchesSearch(mentor, "KUBERNETES")).toBe(true)
    expect(matchesSearch(mentor, "madrid")).toBe(true)
    expect(matchesSearch(mentor, "berlín")).toBe(false)
  })

  // `name` and `location` are nullable: `null.includes()` would throw.
  it("aguanta campos nulos", () => {
    const empty = { name: null, bio: null, location: null }
    expect(() => matchesSearch(empty, "algo")).not.toThrow()
    expect(matchesSearch(empty, "algo")).toBe(false)
  })
})

describe("sortMentors", () => {
  const rows = [
    { name: "Bruno", bio: null, createdAt: new Date("2026-01-01") },
    { name: "Alicia", bio: null, createdAt: new Date("2024-06-15") },
    { name: null, bio: null, createdAt: new Date("2025-03-20") },
  ]

  it("ordena por nombre en ambos sentidos", () => {
    // `(name ?? "")` makes an unnamed row sort before any letter: `""` is the
    // smallest string `localeCompare` can return.
    expect(sortMentors(rows, "name-asc").map((r) => r.name)).toEqual([null, "Alicia", "Bruno"])
    expect(sortMentors(rows, "name-desc").map((r) => r.name)).toEqual(["Bruno", "Alicia", null])
  })

  it("ordena por fecha en ambos sentidos", () => {
    expect(sortMentors(rows, "newest").map((r) => r.name)).toEqual(["Bruno", null, "Alicia"])
    expect(sortMentors(rows, "oldest").map((r) => r.name)).toEqual(["Alicia", null, "Bruno"])
  })

  it("no muta la entrada", () => {
    const original = rows.map((r) => r.name)
    sortMentors(rows, "name-desc")
    expect(rows.map((r) => r.name)).toEqual(original)
  })
})

describe("validación de searchParams", () => {
  it("acepta los valores del catálogo", () => {
    for (const option of FILTER_OPTIONS) expect(isFilterId(option.id)).toBe(true)
    expect(isSortId("name-asc")).toBe(true)
    expect(isSortId("newest")).toBe(true)
  })

  // searchParams are attacker-controlled and end up in the query.
  it("rechaza cualquier otra cosa", () => {
    const garbage = ["", "ALL", "admin", "__proto__", "constructor", "all'", "newest;--", 42, null, undefined, {}]
    for (const value of garbage) expect(isFilterId(value), String(value)).toBe(false)
    for (const value of garbage) expect(isSortId(value), String(value)).toBe(false)
  })
})

describe("directoryUrl", () => {
  it("los valores por defecto no aparecen en la URL", () => {
    expect(directoryUrl({ q: "", cat: "all", sort: "name-asc" }, 1)).toBe("/mentors")
  })

  it("solo añade lo que se aleja del defecto", () => {
    expect(directoryUrl({ q: "", cat: "backend", sort: "name-asc" }, 1)).toBe("/mentors?cat=backend")
    expect(directoryUrl({ q: "", cat: "all", sort: "newest" }, 3)).toBe("/mentors?sort=newest&page=3")
  })

  it("escapa la búsqueda", () => {
    const url = directoryUrl({ q: "react & node", cat: "all", sort: "name-asc" }, 1)
    expect(url).toBe("/mentors?q=react+%26+node")
    expect(decodeURIComponent(url.split("q=")[1].replace(/\+/g, " "))).toBe("react & node")
  })

  // A URL produced here has to survive being parsed back, or a filtered page
  // silently falls back to the default on reload.
  it("reconstruye el mismo estado", () => {
    const state = { q: "ana", cat: "data" as const, sort: "oldest" as const }
    const params = new URLSearchParams(directoryUrl(state, 4).split("?")[1])
    expect(isFilterId(params.get("cat") ?? undefined)).toBe(true)
    expect(isSortId(params.get("sort") ?? undefined)).toBe(true)
    expect(params.get("q")).toBe(state.q)
    expect(Number(params.get("page"))).toBe(4)
  })
})

describe("límites", () => {
  it("una página es un puñado de tarjetas, no el directorio entero", () => {
    expect(MENTORS_PER_PAGE).toBeLessThanOrEqual(24)
    expect(MENTORS_PER_PAGE).toBeGreaterThan(0)
  })

  it("la búsqueda tiene tope", () => {
    expect(MAX_SEARCH_LENGTH).toBeGreaterThan(0)
    expect(MAX_SEARCH_LENGTH).toBeLessThan(500)
  })
})
