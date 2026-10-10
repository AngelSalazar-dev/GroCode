import { cache } from "react"
import { revalidateTag, unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { PUBLIC_AUTHOR } from "@/lib/post-select"

/** Comments preloaded on the post detail view. */
export const COMMENTS_ON_POST = 20

/**
 * Five minutes, the same budget as the mentor directory.
 *
 * The counts are a different story: a like, a bookmark or a comment revalidate
 * the tag immediately, so the number a visitor sees is never older than the
 * next request. What this TTL actually covers is the author's name, avatar and
 * role — no action can fan out to every post a user has written, so those are
 * allowed to lag by at most five minutes after a profile edit.
 */
export const POST_TTL = 300

/** Cache tag for one post. */
export function postTag(id: string): string {
  return `post:${id}`
}

async function fetchPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      resourceUrl: true,
      channel: true,
      createdAt: true,
      author: { select: PUBLIC_AUTHOR },
      _count: { select: { likes: true, bookmarks: true, comments: true } },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: PUBLIC_AUTHOR },
        },
        orderBy: { createdAt: "desc" },
        take: COMMENTS_ON_POST,
      },
    },
  })
}

/**
 * Post detail, cached across requests.
 *
 * Two things make this different from a plain `unstable_cache` wrapper:
 *
 * - **The id must be part of `keyParts`.** The cached closure reads `id` from
 *   the surrounding scope, so `Function.prototype.toString()` is byte-identical
 *   for every post. Without `keyParts` carrying the id, the arguments and the
 *   stringified source are also identical and all posts would share a single
 *   entry — opening one post would overwrite another.
 * - **The tag is per post.** A single shared tag would mean one like anywhere
 *   on the platform expired every post page at once. The wrapper is therefore
 *   created per id, which is the pattern the `unstable_cache` reference itself
 *   uses for a dynamic key.
 *
 * `React.cache` on top keeps `generateMetadata` and the page body from asking
 * for the same post twice inside one request.
 */
export const getPost = cache((id: string) =>
  unstable_cache(() => fetchPost(id), [postTag(id)], {
    tags: [postTag(id)],
    revalidate: POST_TTL,
  })(),
)

/**
 * Drop the cached copy of one post after a write that changed it.
 *
 * `revalidatePath("/post/...")` is not enough on its own: that only expires the
 * rendered HTML, while the counts and comments above live in the Data Cache.
 * `{ expire: 0 }` leaves no window for serving the old numbers, so the next
 * visitor blocks until they have the fresh ones.
 */
export function revalidatePost(id: string): void {
  revalidateTag(postTag(id), { expire: 0 })
}
