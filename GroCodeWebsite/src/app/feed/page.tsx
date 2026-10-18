import { prisma } from "@/lib/prisma"
import FeedClient from "@/components/feed/FeedClient"
import { auth } from "@/auth/auth"
import { Suspense } from "react"

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const session = await auth()
  const { channel } = await searchParams

  const posts = await prisma.post.findMany({
    where: channel ? { channel } : {},
    include: { 
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        }
      },
      likes: session?.user?.id ? {
        where: { userId: session.user.id }
      } : false,
      bookmarks: session?.user?.id ? {
        where: { userId: session.user.id }
      } : false,
      comments: {
        include: { user: true },
        orderBy: { createdAt: "asc" }
      },
      _count: {
        select: {
          likes: true,
          bookmarks: true,
          comments: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <Suspense fallback={<div>Cargando feed...</div>}>
      <FeedClient posts={posts} currentUserId={session?.user?.id} />
    </Suspense>
  )
}
