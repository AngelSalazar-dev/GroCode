import { prisma } from "@/lib/prisma"
import { limit } from "@/lib/rate-limit"

export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "mentorship"
  | "announcement"

/**
 * Server-only notification factory.
 *
 * This deliberately lives OUTSIDE any `"use server"` module: a `"use server"`
 * export becomes a public HTTP endpoint, which would let anyone spam arbitrary
 * users. `fromUserId` is always derived from the session by the caller, never
 * taken from client input.
 */

/**
 * Per-emitter cap. Without it, a scripted client calling toggleFollow /
 * toggleLike / addComment in a loop writes one row per call: unbounded table
 * growth plus targeted notification spam.
 */
const MAX_PER_EMITTER = 30
const EMITTER_WINDOW_MS = 60 * 60 * 1000

export async function notify({
  type,
  content,
  link,
  userId,
  fromUserId,
  postId,
}: {
  type: NotificationType
  content: string
  link?: string
  userId: string
  fromUserId?: string
  postId?: string
}) {
  // Never notify someone about their own action.
  if (fromUserId && fromUserId === userId) return null

  // Throttle before touching the database. Keyed by emitter, not recipient, so
  // the limit does not depend on who is being spammed.
  if (fromUserId) {
    const gate = limit(`notify:${fromUserId}`, MAX_PER_EMITTER, EMITTER_WINDOW_MS)
    if (!gate.ok) return null
  }

  try {
    return await prisma.notification.create({
      data: {
        type,
        content,
        link,
        userId,
        fromUserId,
        postId,
      },
      select: { id: true },
    })
  } catch (error) {
    // A failed notification must never break the action that triggered it.
    // Log name and message only: a Prisma error object can carry the original
    // query, which would put emails and other PII in the logs.
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error)
    console.error(`[notify:${type}] ${detail}`)
    return null
  }
}