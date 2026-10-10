import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

/**
 * `unstable_cache` writes its value with `JSON.stringify` and reads it back
 * with `JSON.parse`. A cache **hit** therefore returns `createdAt` as an ISO
 * string, while a cache **miss** hands back the original Prisma object with a
 * `Date`. The harness below reproduces both so the regression is covered: with
 * no normalisation, sorting by "Más recientes" throws a `TypeError` on the
 * second request and only on the second request.
 */
const harness = vi.hoisted(() => ({ serialized: false }))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache:
    (cb: (...args: unknown[]) => unknown) =>
    async (...args: unknown[]) => {
      const result = await cb(...args)
      return harness.serialized ? JSON.parse(JSON.stringify(result)) : result
    },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: vi.fn() } },
}))

const { prisma } = await import("@/lib/prisma")
const { revalidateTag } = await import("next/cache")
const { getMentorDirectory, revalidateMentors } = await import("@/lib/mentors")

const findMany = prisma.user.findMany as Mock

const senior = (
  id: string,
  name: string | null,
  bio: string | null,
  createdAt: string,
  location: string | null = null,
) => ({ id, name, image: null, bio, location, createdAt: new Date(createdAt) })

/** Four mentors with one distinctive specialty each. */
const FOUR = [
  senior("u-ana", "Ana Torres", "React y accesibilidad", "2024-06-15T00:00:00.000Z", "Madrid"),
  senior("u-bruno", "Bruno Díaz", "Experto en Go y PostgreSQL", "2026-01-01T00:00:00.000Z"),
  senior("u-carlos", "Carlos Rey", "Amigo de los algoritmos", "2025-03-20T00:00:00.000Z"),
  senior("u-diana", "Diana Cruz", "Flutter y Docker", "2025-09-01T00:00:00.000Z"),
]

const ALL = { q: "", cat: "all" as const, sort: "name-asc" as const, page: 1 }

beforeEach(() => {
  vi.clearAllMocks()
  harness.serialized = false
  findMany.mockResolvedValue(FOUR)
})

describe("getMentorDirectory", () => {
  it.each([false, true])(
    "ordena por fecha con la caché %s serializada",
    async (serialized) => {
      harness.serialized = serialized
      const result = await getMentorDirectory({ ...ALL, sort: "newest" })
      expect(result.mentors.map((m) => m.id)).toEqual([
        "u-bruno",
        "u-diana",
        "u-carlos",
        "u-ana",
      ])
    },
  )

  it("nunca saca createdAt al cliente", async () => {
    const result = await getMentorDirectory(ALL)
    expect(result.mentors[0]).not.toHaveProperty("createdAt")
    expect(Object.keys(result.mentors[0]).sort()).toEqual([
      "bio",
      "id",
      "image",
      "location",
      "name",
    ])
  })

  it("cuenta cada especialidad con la misma regla que consulta", async () => {
    const result = await getMentorDirectory(ALL)
    expect(result.counts).toEqual({
      all: 4,
      frontend: 1,
      backend: 1,
      devops: 1,
      mobile: 1,
      data: 0,
    })
  })

  it("la búsqueda cruza nombre, bio y ubicación", async () => {
    const byLocation = await getMentorDirectory({ ...ALL, q: "madrid" })
    expect(byLocation.mentors.map((m) => m.id)).toEqual(["u-ana"])

    const byName = await getMentorDirectory({ ...ALL, q: "BRUNO" })
    expect(byName.mentors.map((m) => m.id)).toEqual(["u-bruno"])

    const nothing = await getMentorDirectory({ ...ALL, q: "zzz" })
    expect(nothing.mentors).toEqual([])
    expect(nothing.total).toBe(0)
    expect(nothing.totalPages).toBe(1)
  })

  it("el especialidad filtra de verdad", async () => {
    const backend = await getMentorDirectory({ ...ALL, cat: "backend" })
    expect(backend.mentors.map((m) => m.id)).toEqual(["u-bruno"])
    expect(backend.total).toBe(1)
  })

  it("el total es del directorio, no de la página", async () => {
    const result = await getMentorDirectory({ ...ALL, q: "zzz" })
    expect(result.total).toBe(0)
    expect(result.mentors).toEqual([])
    // An empty result still has to render a real page, or the pagination
    // controls disappear and the user is stuck.
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it("acota la página pedida al último que existe", async () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      senior(`u-x${i}`, `Extra ${i}`, null, `2023-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`),
    )
    findMany.mockResolvedValue([...FOUR, ...many])

    const first = await getMentorDirectory({ ...ALL, page: 1 })
    expect(first.totalPages).toBe(2)
    expect(first.mentors).toHaveLength(12)

    const second = await getMentorDirectory({ ...ALL, page: 2 })
    expect(second.page).toBe(2)
    expect(second.mentors).toHaveLength(6)

    // `?page=999` used to produce an empty screen with no way back.
    const clamped = await getMentorDirectory({ ...ALL, page: 999 })
    expect(clamped.page).toBe(2)
    expect(clamped.mentors).toHaveLength(6)
  })
})

describe("revalidateMentors", () => {
  it("invalida la etiqueta del directorio, que revalidatePath no toca", () => {
    revalidateMentors()
    // `{ expire: 0 }`: sin ventana para servir datos viejos, así quien acaba
    // de aprobar a un senior lo ve en el primer intento.
    expect(revalidateTag).toHaveBeenCalledWith("mentors", { expire: 0 })
  })
})
