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
 * Fields the mentor directory renders. Narrower than `publicUserSelect` on
 * purpose: `website` and `role` are never shown there, and this is the shape
 * that gets cached and serialized for `/mentors`.
 */
export const mentorDirectorySelect = {
  id: true,
  name: true,
  image: true,
  bio: true,
  location: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type MentorDirectoryUser = Prisma.UserGetPayload<{
  select: typeof mentorDirectorySelect
}>

/**
 * What a mentor card renders. `createdAt` is picked out of
 * `mentorDirectoryUser` because it only exists to sort the list on the server
 * and never crosses the boundary.
 */
export type MentorCard = Pick<
  MentorDirectoryUser,
  "id" | "name" | "image" | "bio" | "location"
>

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
