import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

/**
 * `/post/[id]` moved its detail query into the Data Cache, which means two
 * things can regress silently:
 *
 * 1. `unstable_cache` derives its key from `keyParts` plus the cached
 *    function's arguments and `Function.prototype.toString()`. The cached
 *    closure reads `id` from the surrounding scope, so the source text is
 *    byte-identical for every post — leave the id out of `keyParts` and the
 *    whole platform shares one entry.
 * 2. Caching the counts is useless unless every write expires the tag. The
 *    actions below are the only three mutations that touch a post, so if
 *    `revalidatePost` disappears from `revalidatePostViews` these tests fail.
 */
const harness = vi.hoisted(() => ({
  serialized: false,
  registrations: [] as { keyParts: string[]; tags: string[]; revalidate: unknown }[],
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache:
    (cb: (...args: unknown[]) => unknown, keyParts?: string[], options?: { tags?: string[]; revalidate?: number }) => {
      harness.registrations.push({
        keyParts: keyParts ?? [],
        tags: options?.tags ?? [],
        revalidate: options?.revalidate,
      })
      return async (...args: unknown[]) => {
        const result = await cb(...args)
        return harness.serialized ? JSON.parse(JSON.stringify(result)) : result
      }
    },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findUnique: vi.fn() },
    like: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    bookmark: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    comment: { create: vi.fn() },
  },
}))
vi.mock("@/auth/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/notifications", () => ({ notify: vi.fn(async () => null) }))

const { prisma } = await import("@/lib/prisma")
const { auth } = await import("@/auth/auth")
const { revalidateTag, revalidatePath } = await import("next/cache")
const { getPost, revalidatePost } = await import("@/lib/post-detail")
const { toggleLike, toggleBookmark, addComment } = await import("@/actions/interactions")

const findUnique = prisma.post.findUnique as Mock

/** `React.cache` may memoize for the whole file, so every test gets its own id. */
const post = (id: string) => ({
  id,
  content: "Hola GroCode",
  resourceUrl: null,
  channel: "general",
  createdAt: new Date("2026-01-15T10:00:00.000Z"),
  author: { id: "u-author", name: "Ana Torres", image: null, role: "SENIOR" },
  _count: { likes: 3, bookmarks: 1, comments: 2 },
  comments: [
    {
      id: "c-1",
      content: "Buenísimo",
      createdAt: new Date("2026-01-16T08:30:00.000Z"),
      user: { id: "u-2", name: "Bruno Díaz", image: null, role: "JUNIOR" },
    },
  ],
})

beforeEach(() => {
  vi.clearAllMocks()
  harness.serialized = false
  harness.registrations.length = 0
  ;(auth as Mock).mockResolvedValue({ user: { id: "u-me", name: "Yo" } })
})

describe("getPost", () => {
  it("llavea y etiqueta cada post por su id", async () => {
    findUnique.mockResolvedValue(post("key-a"))
    await getPost("key-a")
    findUnique.mockResolvedValue(post("key-b"))
    await getPost("key-b")

    const [a, b] = harness.registrations
    // Sin el id en keyParts las dos entradas serían la misma y el primer post
    // pisaría al segundo.
    expect(a.keyParts).toEqual(["post:key-a"])
    expect(b.keyParts).toEqual(["post:key-b"])
    expect(a.keyParts).not.toEqual(b.keyParts)
    expect(a.tags).toEqual(["post:key-a"])
    expect(b.tags).toEqual(["post:key-b"])
    // 300 s: una TTL distinta cambia cuánto tarda en curarse un nombre de
    // autor que ninguna acción invalida.
    expect(a.revalidate).toBe(300)
  })

  it.each([false, true])("sobrevive la serializacion de la cache: %s", async (serialized) => {
    harness.serialized = serialized
    const id = serialized ? "ser-yes" : "ser-no"
    findUnique.mockResolvedValue(post(id))

    const result = await getPost(id)

    // `PostCard` hace `new Date(createdAt)` en el cliente: una caché acertada
    // devuelve un ISO string y una fallida un Date, y las dos tienen que
    // producir el mismo instante.
    expect(result).not.toBeNull()
    expect(new Date(result!.createdAt).toISOString()).toBe("2026-01-15T10:00:00.000Z")
    expect(new Date(result!.comments[0].createdAt).toISOString()).toBe("2026-01-16T08:30:00.000Z")
    expect(result!._count).toEqual({ likes: 3, bookmarks: 1, comments: 2 })
    expect(result!.author.name).toBe("Ana Torres")
  })

  it("devuelve null cuando el post no existe", async () => {
    findUnique.mockResolvedValue(null)
    await expect(getPost("missing-1")).resolves.toBeNull()
  })
})

describe("revalidatePost", () => {
  it("expira solo ese post y sin ventana de datos viejos", () => {
    revalidatePost("only-1")
    expect(revalidateTag).toHaveBeenCalledWith("post:only-1", { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledTimes(1)
  })
})

describe("acciones: la cache del post se expira en cada mutacion", () => {
  const seenPost = (id: string) => {
    findUnique.mockResolvedValue({ id, authorId: "u-author" })
  }

  it("toggleLike expira el post", async () => {
    seenPost("p-like")
    ;(prisma.like.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.like.create as Mock).mockResolvedValue({ id: "like-1" })

    expect(await toggleLike("p-like")).toEqual({ liked: true })

    expect(revalidateTag).toHaveBeenCalledWith("post:p-like", { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith("/feed")
  })

  it("toggleBookmark expira el post", async () => {
    seenPost("p-bookmark")
    ;(prisma.bookmark.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.bookmark.create as Mock).mockResolvedValue({ id: "bm-1" })

    expect(await toggleBookmark("p-bookmark")).toEqual({ bookmarked: true })

    expect(revalidateTag).toHaveBeenCalledWith("post:p-bookmark", { expire: 0 })
  })

  it("addComment expira el post", async () => {
    seenPost("p-comment")
    ;(prisma.comment.create as Mock).mockResolvedValue({
      id: "c-9",
      content: "hola",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      user: {
        id: "u-me",
        name: "Yo",
        image: null,
        role: "JUNIOR",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    })

    const created = await addComment("p-comment", "  hola  ")

    expect(created.createdAt).toBe("2026-02-01T00:00:00.000Z")
    expect(revalidateTag).toHaveBeenCalledWith("post:p-comment", { expire: 0 })
  })

  it("desaparece el post y no se escribe nada", async () => {
    findUnique.mockResolvedValue(null)
    await expect(toggleLike("p-gone")).rejects.toThrow()
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
