import { describe, it, expect, beforeEach, vi, type Mock } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: { create: vi.fn(), findUnique: vi.fn() },
    like: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    comment: { create: vi.fn() },
    follow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock("@/auth/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/notifications", () => ({ notify: vi.fn(async () => null) }))

// createPost ends with redirect(), which must not be swallowed by its catch.
// Throwing here mimics the real NEXT_REDIRECT contract.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT")
  }),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (cb: unknown) => cb,
}))

const { auth } = await import("@/auth/auth")
const { prisma } = await import("@/lib/prisma")
const { resetRateLimits } = await import("@/lib/rate-limit")
const { createPost } = await import("@/actions/posts")
const { addComment, toggleLike } = await import("@/actions/interactions")
const { toggleFollow } = await import("@/actions/follow")

function postForm(content = "contenido suficientemente largo") {
  const fd = new FormData()
  fd.set("content", content)
  return fd
}

/** Calls `fn` until it reports the limit; returns how many calls got through. */
async function callsUntilBlocked(fn: () => Promise<unknown>): Promise<number> {
  for (let i = 1; i <= 100; i++) {
    try {
      const result = await fn()
      if (result && typeof result === "object" && "error" in result) return i - 1
    } catch (error) {
      if (String(error).includes("NEXT_REDIRECT")) continue
      if (/Demasiadas acciones|alcanzado el límite/.test(String(error))) return i - 1
      throw error
    }
  }
  return -1
}

describe("límites anti-abuso en contenido", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    ;(auth as Mock).mockResolvedValue({ user: { id: "user-1", role: "JUNIOR", name: "Ana" } })
    ;(prisma.post.create as Mock).mockResolvedValue({ id: "post-1" })
    ;(prisma.post.findUnique as Mock).mockResolvedValue({ id: "post-1", authorId: "user-1" })
    ;(prisma.like.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.like.create as Mock).mockResolvedValue({})
    ;(prisma.comment.create as Mock).mockResolvedValue({
      id: "c-1",
      content: "hola",
      createdAt: new Date(),
      user: { id: "user-1", name: "Ana" },
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({ id: "target-1", name: "Luis" })
    ;(prisma.follow.findUnique as Mock).mockResolvedValue(null)
    ;(prisma.follow.create as Mock).mockResolvedValue({})
  })

  it("createPost permite 10 por hora y bloquea la 11", async () => {
    expect(await callsUntilBlocked(() => createPost(postForm()))).toBe(10)
  })

  it("addComment permite 20 por hora y bloquea el 21", async () => {
    expect(await callsUntilBlocked(() => addComment("post-1", "comentario"))).toBe(20)
  })

  it("toggleLike permite 60 por hora y bloquea el 61", async () => {
    // Alternate the mock so every call creates instead of deleting.
    ;(prisma.like.findUnique as Mock).mockResolvedValue(null)
    expect(await callsUntilBlocked(() => toggleLike("post-1"))).toBe(60)
  })

  it("toggleFollow permite 60 por hora y bloquea el 61", async () => {
    expect(await callsUntilBlocked(() => toggleFollow("target-1"))).toBe(60)
  })

  it("el límite es por usuario, no global", async () => {
    for (let i = 0; i < 10; i++) {
      await expect(createPost(postForm())).rejects.toThrow("NEXT_REDIRECT")
    }
    ;(auth as Mock).mockResolvedValue({ user: { id: "user-2", role: "JUNIOR", name: "Beto" } })

    await expect(createPost(postForm())).rejects.toThrow("NEXT_REDIRECT")
  })
})
