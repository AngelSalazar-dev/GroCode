import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import Link from "next/link"
import { cache } from "react"
import { notFound } from "next/navigation"
import MentorRequestButton from "@/components/mentorship/MentorRequestButton"
import ProfileClientSection from "@/components/profile/ProfileClientSection"
import FollowButton from "@/components/profile/FollowButton"
import PostCard from "@/components/feed/PostCard"
import { publicUserSelect } from "@/lib/select"
import { postListSelect, PUBLIC_AUTHOR } from "@/lib/post-select"
import UserAvatar from "@/components/UserAvatar"
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageSquare,
  Briefcase,
  BookOpen,
  Users,
} from "lucide-react"

/** Posts shown on a profile before pagination lands. */
const POSTS_PER_PROFILE = 20

/** Comments preloaded per post on the profile view. */
const COMMENTS_PER_POST = 3

/**
 * Shared between `generateMetadata` and the page. Without `cache()` the two
 * functions each ran their own `findUnique`, doubling the queries per request.
 */
const getPublicUser = cache(async (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { name: true, role: true, bio: true },
  })
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getPublicUser(id)

  if (!user) {
    return {
      title: "Perfil no encontrado",
      description: "El perfil solicitado no existe.",
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${user.name || "Usuario"} - Perfil de ${user.role}`,
    description: user.bio || `Perfil de ${user.role} en GroCode`,
    keywords: ["perfil", user.role.toLowerCase(), "grocode"],
    authors: [{ name: user.name || "Usuario" }],
    openGraph: {
      type: "profile",
      title: `${user.name || "Usuario"} en GroCode`,
      description: user.bio || `Perfil de ${user.role} en GroCode`,
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const viewerId = session?.user?.id

  const [user, posts] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        ...publicUserSelect,
        _count: {
          select: {
            followers: true,
            following: true,
            sentRequests: true,
            receivedRequests: true,
            posts: true,
          },
        },
        // `User.followers` is the inverse of Follow.following, i.e. the rows
        // where this user is being followed. Filtering by followerId answers
        // "does the viewer follow this user?". The sentinel matches nothing.
        followers: {
          where: { followerId: viewerId ?? "__no_viewer__" },
          select: { followerId: true },
          take: 1,
        },
      },
    }),
    prisma.post.findMany({
      where: { authorId: id },
      select: postListSelect(viewerId),
      orderBy: { createdAt: "desc" },
      take: POSTS_PER_PROFILE,
    }),
  ])

  if (!user) notFound()

  const isOwnProfile = viewerId === user.id
  const isFollowing = user.followers.length > 0

  // Comments in one query, bounded per post, so one popular post cannot pull
  // thousands of rows.
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

  const grouped = new Map<string, typeof commentsByPost>()
  for (const comment of commentsByPost) {
    const bucket = grouped.get(comment.postId) ?? []
    if (bucket.length < COMMENTS_PER_POST) {
      bucket.push(comment)
      grouped.set(comment.postId, bucket)
    }
  }

  const isSenior = user.role === "SENIOR"

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Profile Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-8">
          <div className="space-y-5">
            <UserAvatar
              src={user.image}
              name={user.name}
              size={200}
              rounded="rounded-[2rem]"
              className="w-full max-w-[200px] aspect-square mx-auto lg:mx-0 border-2 border-border-gro shadow-2xl group"
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
                {isSenior && (
                  <span
                    title="Senior Verificado"
                    aria-label="Senior Verificado"
                    className="text-amber-700 dark:text-amber-500"
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                )}
              </div>
              <p className="text-muted font-medium text-sm">
                @{user.name?.toLowerCase().replace(/\s+/g, "") ?? "username"}
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  isSenior
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/20"
                    : "bg-accent-gro/10 text-accent-gro border-accent-gro/20"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {user.bio && (
            <p className="text-sm font-medium leading-relaxed text-foreground/80 break-words">
              {user.bio}
            </p>
          )}

          <div className="space-y-2.5">
            {user.location && (
              <div className="flex items-center gap-3 text-sm text-muted font-semibold">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{user.location}</span>
              </div>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="flex items-center gap-3 text-sm text-accent-gro font-semibold hover:underline"
              >
                <LinkIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {user.website.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                </span>
              </a>
            )}
            <div className="flex items-center gap-3 text-sm text-muted font-semibold">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                Se unió en{" "}
                {new Date(user.createdAt).toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {isOwnProfile ? (
              <ProfileClientSection
                user={{
                  id: user.id,
                  name: user.name,
                  image: user.image,
                  bio: user.bio,
                  location: user.location,
                  website: user.website,
                }}
              />
            ) : (
              <FollowButton
                targetUserId={user.id}
                initialFollowing={isFollowing}
                isLoggedIn={!!viewerId}
              />
            )}
            <MentorRequestButton seniorId={user.id} seniorRole={user.role} />
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Recursos"
              value={user._count.posts}
              icon={<BookOpen className="w-4 h-4" />}
            />
            {/* Counters are now links: previously they were displayed with a
                hover affordance but did nothing. */}
            <StatCard
              label="Seguidores"
              value={user._count.followers}
              icon={<Users className="w-4 h-4" />}
              href={`/profile/${user.id}/followers`}
            />
            <StatCard
              label="Siguiendo"
              value={user._count.following}
              icon={<Users className="w-4 h-4" />}
              href={`/profile/${user.id}/following`}
            />
            {/* Seniors receive requests; juniors send them. Using sentRequests
                for both made a mentor with five juniors show "Mentorías: 0". */}
            <StatCard
              label={isSenior ? "Solicitudes recibidas" : "Mentorías"}
              value={isSenior ? user._count.receivedRequests : user._count.sentRequests}
              icon={<MessageSquare className="w-4 h-4" />}
            />
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-8 border-b border-border-gro pb-0">
              <span className="text-sm font-black uppercase tracking-widest text-accent-gro pb-4 relative">
                Recursos
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full" />
              </span>
            </div>

            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
                      comments: (grouped.get(post.id) ?? []).map(
                        ({ postId: _postId, ...rest }) => rest
                      ),
                    }}
                    currentUserId={viewerId}
                  />
                ))
              ) : (
                <div className="py-24 text-center gro-card border-dashed bg-transparent space-y-4">
                  <Briefcase className="w-12 h-12 text-muted/40 mx-auto" />
                  <p className="text-muted font-medium italic">
                    Este usuario aún no ha compartido recursos públicos.
                  </p>
                </div>
              )}

              {user._count.posts > posts.length && (
                <p className="text-center text-sm text-muted font-medium pt-4">
                  Mostrando {posts.length} de {user._count.posts} recursos.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  href?: string
}) {
  const body = (
    <>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">
          {label}
        </p>
        <p className="text-2xl font-black">{value}</p>
      </div>
      <div className="text-muted">{icon}</div>
    </>
  )

  // No hover affordance unless the card is actually a link.
  if (href) {
    return (
      <Link
        href={href}
        className="gro-card p-5 flex items-center justify-between hover:border-accent-gro transition-colors"
      >
        {body}
      </Link>
    )
  }

  return <div className="gro-card p-5 flex items-center justify-between">{body}</div>
}