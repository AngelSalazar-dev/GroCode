import { Prisma } from "@/generated-v2/client"

/**
 * Whitelist of User fields that are safe to serialize to the client.
 *
 * Anything NOT listed here must never cross the server/client boundary:
 * `password` is a bcrypt hash and leaking it to the browser compromises
 * every account it belongs to.
 */
export const publicUserSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  bio: true,
  location: true,
  website: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>

/**
 * Safe to nest inside `include` when the relation is rendered on the client.
 * Excludes `email` (PII) and `password` (credential).
 */
export const postAuthorSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect
