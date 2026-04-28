import { prisma } from "@/lib/prisma"
import FeedClient from "@/components/feed/FeedClient"

import { auth } from "@/auth/auth"

export default async function FeedPage() {
  const session = await auth()
  const posts = await prisma.post.findMany({
    include: { 
      author: true,
      likes: true,
      bookmarks: true,
      comments: true,
    },
    orderBy: { createdAt: "desc" }
  })

  return <FeedClient posts={posts} currentUserId={session?.user?.id} />
}
