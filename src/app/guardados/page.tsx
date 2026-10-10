import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import PostCard from "@/components/feed/PostCard"
import { postAuthorSelect } from "@/lib/select"
import { Bookmark } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Guardados - GroCode",
  description: "Los recursos que has guardado para consultar más tarde.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

const BOOKMARKS_PER_PAGE = 20

/**
 * Saved posts.
 *
 * Bookmarks were write-only: the button persisted a row and there was no view
 * anywhere in the app to read it back, so anything saved was effectively lost.
 */
export default async function SavedPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return (
      <EmptyState
        title="Inicia sesión para ver tus guardados"
        body="Los recursos que guardes aparecerán aquí."
      />
    )
  }

  const params = await searchParams
  const parsed = Number.parseInt(params.page ?? "1", 10)
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 1
  const skip = (page - 1) * BOOKMARKS_PER_PAGE

  const [saved, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      select: {
        createdAt: true,
        post: {
          select: {
            id: true,
            content: true,
            resourceUrl: true,
            channel: true,
            createdAt: true,
            author: { select: postAuthorSelect },
            _count: { select: { likes: true, bookmarks: true, comments: true } },
            comments: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                user: { select: postAuthorSelect },
              },
              orderBy: { createdAt: "desc" },
              take: 3,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: BOOKMARKS_PER_PAGE,
      skip,
    }),
    prisma.bookmark.count({ where: { userId } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / BOOKMARKS_PER_PAGE))

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Bookmark className="w-7 h-7" /> Guardados
        </h1>
        <p className="text-sm text-muted font-medium">
          {total === 0
            ? "Aún no has guardado ningún recurso."
            : `${total} ${total === 1 ? "recurso guardado" : "recursos guardados"}`}
        </p>
      </header>

      {saved.length === 0 ? (
        <EmptyState
          title="Nada guardado todavía"
          body="Pulsa el icono de marcador en cualquier publicación y aparecerá aquí."
        />
      ) : (
        <div className="space-y-6">
          {saved.map(({ post }) => (
            <PostCard
              key={post.id}
              // The viewer saved it, so their bookmark row is present by
              // definition; `take: 1` keeps the payload to one identifier.
              post={{ ...post, likes: [], bookmarks: [{ userId }] }}
              currentUserId={userId}
            />
          ))}

          {totalPages > 1 && (
            <nav
              aria-label="Paginación de guardados"
              className="flex items-center justify-center gap-4 pt-4"
            >
              {page > 1 ? (
                <Link
                  href={`/guardados?page=${page - 1}`}
                  className="gro-btn !rounded-full !px-6 !py-2 !text-xs"
                >
                  Anterior
                </Link>
              ) : (
                <span className="gro-btn !rounded-full !px-6 !py-2 !text-xs opacity-70 cursor-not-allowed">
                  Anterior
                </span>
              )}
              <span className="text-sm text-muted">
                Página {page} de {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/guardados?page=${page + 1}`}
                  className="gro-btn !rounded-full !px-6 !py-2 !text-xs"
                >
                  Siguiente
                </Link>
              ) : (
                <span className="gro-btn !rounded-full !px-6 !py-2 !text-xs opacity-70 cursor-not-allowed">
                  Siguiente
                </span>
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="py-24 text-center space-y-4 gro-card border-dashed bg-transparent">
        <Bookmark className="w-12 h-12 text-muted/40 mx-auto" />
        <p className="font-bold">{title}</p>
        <p className="text-muted text-sm">{body}</p>
        <Link
          href="/feed"
          className="gro-btn gro-btn-primary !rounded-full !px-8 !py-3 mt-2 inline-block"
        >
          Explorar el feed
        </Link>
      </div>
    </div>
  )
}