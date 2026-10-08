import type { Prisma } from "@/generated-v2/client"

/**
 * Sentinel used in `where` clauses when there is no viewer. A cuid can never
 * equal this, so the query matches nothing instead of leaking every row.
 */
export const NO_VIEWER = "__no_viewer__"

/**
 * Minimal author projection. Deliberately narrower than `publicUserSelect`:
 * a post card renders the name, avatar and role and nothing else.
 */
export const PUBLIC_AUTHOR = {
  id: true,
  name: true,
  image: true,
  role: true,
} as const

/**
 * Relation shape for a post in a list.
 *
 * `_count` carries the totals the UI displays, while `likes`/`bookmarks` carry
 * ONLY the current viewer's own row. Shipping the full `likes[].userId` list
 * used to let any signed-in user rebuild the platform's entire social graph
 * from the feed payload, and made a viral post megabytes large.
 */
export function postListSelect(viewerId?: string) {
  const viewer = viewerId ?? NO_VIEWER

  return {
    id: true,
    content: true,
    resourceUrl: true,
    channel: true,
    createdAt: true,
    authorId: true,
    author: { select: PUBLIC_AUTHOR },
    _count: { select: { likes: true, bookmarks: true, comments: true } },
    likes: { where: { userId: viewer }, select: { userId: true }, take: 1 },
    bookmarks: { where: { userId: viewer }, select: { userId: true }, take: 1 },
  } satisfies Prisma.PostSelect
}

export type PostListItem = Prisma.PostGetPayload<{
  select: ReturnType<typeof postListSelect>
}>