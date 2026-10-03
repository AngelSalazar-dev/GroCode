import { prisma } from "@/lib/prisma"
import FeedClient from "@/components/feed/FeedClient"
import { auth } from "@/auth/auth"

interface FeedPageProps {
  searchParams: Promise<{ page?: string; channel?: string }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const session = await auth()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || "1"))
  const channel = params.channel || "general"
  const take = 10
  const skip = (page - 1) * take

  const where = channel === "all" ? {} : { channel }

  const [posts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      include: { 
        author: true,
        likes: true,
        bookmarks: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.post.count({ where }),
  ])

  return (
    <FeedClient 
      posts={posts} 
      currentUserId={session?.user?.id} 
      totalPosts={totalPosts} 
      currentPage={page} 
      take={take}
      activeChannel={channel}
    />
  )
}