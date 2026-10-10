import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import UserAvatar from "@/components/UserAvatar"

export const metadata = {
  title: "Seguidores - GroCode",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

const PER_PAGE = 24

/**
 * Follower / following lists.
 *
 * Until now only the counters existed, so the Follow feature produced numbers
 * nobody could act on.
 *
 * Relation direction: `User.followers` is the inverse of `Follow.following`, so
 * it holds the rows where THIS user is the one being followed. `User.following`
 * holds the rows where this user is the follower.
 */
export default async function FollowListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; list: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ id, list }, session, query] = await Promise.all([
    params,
    auth(),
    searchParams,
  ])

  const mode = list === "following" ? "following" : "followers"
  const viewerId = session?.user?.id

  const parsed = Number.parseInt(query.page ?? "1", 10)
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 50) : 1
  const skip = (page - 1) * PER_PAGE

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      _count: { select: { followers: true, following: true } },
    },
  })

  if (!user) notFound()

  const [people, total] = await Promise.all([
    prisma.user.findMany({
      where:
        mode === "followers"
          ? { followers: { some: { followingId: id } } }
          : { following: { some: { followerId: id } } },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
      },
      orderBy: { name: "asc" },
      take: PER_PAGE,
      skip,
    }),
    mode === "followers"
      ? prisma.follow.count({ where: { followingId: id } })
      : prisma.follow.count({ where: { followerId: id } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <div className="space-y-4">
        <Link
          href={`/profile/${id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al perfil
        </Link>

        <h1 className="text-3xl font-black tracking-tight">
          {mode === "followers" ? "Seguidores" : "Siguiendo"}
          <span className="text-muted font-medium text-xl"> de {user.name}</span>
        </h1>

        <div className="flex gap-2 text-sm font-semibold">
          <Link
            href={`/profile/${id}/followers`}
            aria-current={mode === "followers" ? "page" : undefined}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              mode === "followers"
                ? "bg-accent-gro/10 text-accent-gro"
                : "text-muted hover:text-foreground"
            }`}
          >
            {user._count.followers} seguidores
          </Link>
          <Link
            href={`/profile/${id}/following`}
            aria-current={mode === "following" ? "page" : undefined}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              mode === "following"
                ? "bg-accent-gro/10 text-accent-gro"
                : "text-muted hover:text-foreground"
            }`}
          >
            {user._count.following} siguiendo
          </Link>
        </div>
      </div>

      {people.length === 0 ? (
        <div className="py-20 text-center space-y-4 gro-card border-dashed bg-transparent">
          <Users className="w-12 h-12 text-muted/40 mx-auto" />
          <p className="font-bold">
            {mode === "followers" ? "Todavía sin seguidores" : "No sigue a nadie"}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                href={`/profile/${person.id}`}
                className="gro-card p-4 flex items-center gap-4 hover:border-accent-gro transition-colors"
              >
                <UserAvatar
                  src={person.image}
                  name={person.name}
                  size={44}
                  className="w-11 h-11 border border-border-gro"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{person.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                    {person.role}
                    {person.id === viewerId && " · tú"}
                  </p>
                  {person.bio && (
                    <p className="text-xs text-muted mt-1 line-clamp-1">{person.bio}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Paginación"
          className="flex items-center justify-center gap-4 pt-4"
        >
          {page > 1 ? (
            <Link
              href={`/profile/${id}/${mode}?page=${page - 1}`}
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
              href={`/profile/${id}/${mode}?page=${page + 1}`}
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
  )
}