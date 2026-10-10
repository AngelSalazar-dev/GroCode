import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth/auth"
import PostCard from "@/components/feed/PostCard"
import { getPost } from "@/lib/post-detail"
import { getChannel } from "@/lib/channels"
import { Hash, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  // Same cached read the page body uses: this used to be a second, uncached
  // `findUnique` per request, so every visit queried the post twice.
  const post = await getPost(id)

  if (!post) {
    return {
      title: "Publicación no encontrada",
      description: "Este recurso ya no está disponible.",
      // notFound() on a streamed segment answers 200, so the explicit directive
      // is what keeps it out of the index.
      robots: { index: false, follow: false },
    }
  }

  const label = getChannel(post.channel).label
  const excerpt = post.content.slice(0, 155)
  const title = `${post.author.name ?? "Alguien"} en #${label}`

  return {
    title,
    description: excerpt.length < post.content.length ? `${excerpt}…` : excerpt,
    openGraph: { type: "article", title, description: excerpt },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const viewerId = session?.user?.id

  const post = await getPost(id)
  if (!post) notFound()

  // Only the viewer's own rows. Fetching the full like/bookmark lists here
  // would ship every user's interactions to whoever opens the page.
  const [likes, bookmarks] = viewerId
    ? await Promise.all([
        prisma.like.findMany({
          where: { postId: id, userId: viewerId },
          select: { userId: true },
          take: 1,
        }),
        prisma.bookmark.findMany({
          where: { postId: id, userId: viewerId },
          select: { userId: true },
          take: 1,
        }),
      ])
    : [[], []]

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href={`/feed?channel=${post.channel}&page=1`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al feed
        </Link>
        <Link
          href={`/feed?channel=${post.channel}&page=1`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-gro hover:underline"
        >
          <Hash className="w-3.5 h-3.5" /> {getChannel(post.channel).label}
        </Link>
      </div>

      <PostCard
        post={{ ...post, likes, bookmarks }}
        currentUserId={viewerId}
      />
    </div>
  )
}