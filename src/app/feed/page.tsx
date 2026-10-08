import { prisma } from "@/lib/prisma"
import FeedClient from "@/components/feed/FeedClient"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { postListSelect, PUBLIC_AUTHOR } from "@/lib/post-select"
import { isValidChannel } from "@/lib/channels"
import { parsePage, FEED_TAKE as TAKE } from "@/lib/paging"

/** Comments rendered inside a post card. */
const COMMENTS_PER_POST = 5

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; channel?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  const viewerId = session?.user?.id

  // Fresh accounts land on onboarding. Without this the screen was
  // unreachable: nothing anywhere checked the flag.
  if (viewerId) {
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { onboardingCompleted: true },
    })
    if (viewer && !viewer.onboardingCompleted) {
      redirect("/onboarding")
    }
  }

  // parseInt("abc") is NaN, and a NaN `skip` makes Prisma throw.
  const page = parsePage(params.page)
  const channel = isValidChannel(params.channel) ? params.channel : "general"
  const skip = (page - 1) * TAKE

  const where = { channel }

  const [posts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      select: postListSelect(viewerId),
      where,
      orderBy: { createdAt: "desc" },
      take: TAKE,
      skip,
    }),
    prisma.post.count({ where }),
  ])

  // Comments are fetched in one extra query rather than nested per post, so a
  // viral post cannot pull thousands of rows through the join.
  const postIds = posts.map((p) => p.id)

  const commentsByPost = postIds.length
    ? await prisma.comment.findMany({
        where: { postId: { in: postIds } },
        select: {
          id: true,
          content: true,
          createdAt: true,
          postId: true,
          user: { select: PUBLIC_AUTHOR },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

  // Keep only the newest N per post.
  const grouped = new Map<string, typeof commentsByPost>()
  for (const comment of commentsByPost) {
    const bucket = grouped.get(comment.postId) ?? []
    if (bucket.length < COMMENTS_PER_POST) {
      bucket.push(comment)
      grouped.set(comment.postId, bucket)
    }
  }

  const withComments = posts.map((post) => ({
    ...post,
    comments: (grouped.get(post.id) ?? []).map(({ postId: _postId, ...rest }) => rest),
  }))

  return (
    <FeedClient
      posts={withComments}
      currentUserId={viewerId}
      totalPosts={totalPosts}
      currentPage={page}
      take={TAKE}
      activeChannel={channel}
    />
  )
}