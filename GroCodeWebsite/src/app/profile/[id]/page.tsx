import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import { notFound } from "next/navigation"
import MentorRequestButton from "@/components/mentorship/MentorRequestButton"
import ProfileClientSection from "@/components/profile/ProfileClientSection"
import ProfileFeed from "@/components/profile/ProfileFeed"
import ProfileRequests from "@/components/profile/ProfileRequests"
import FollowButton from "@/components/profile/FollowButton"
import { isFollowing } from "@/actions/follow"
import { ShieldCheck, User as UserIcon, Calendar, MapPin, Link as LinkIcon, MessageSquare, BookOpen, Users, Star } from "lucide-react"

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        include: { author: true, _count: { select: { likes: true, comments: true, bookmarks: true } } },
        orderBy: { createdAt: "desc" }
      },
      projects: {
        include: { skills: true, _count: { select: { collaborators: true } } },
        orderBy: { createdAt: "desc" }
      },
      likes: {
        include: { post: { include: { author: true, _count: { select: { likes: true, comments: true, bookmarks: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      comments: {
        include: { post: { include: { author: true, _count: { select: { likes: true, comments: true, bookmarks: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      // Requests received as a Senior
      receivedRequests: session?.user?.id === id ? {
        where: { status: "PENDING" },
        include: { junior: true },
        orderBy: { createdAt: "desc" }
      } : false,
      // Requests received for their projects
      receivedCollabReqs: session?.user?.id === id ? {
        where: { status: "PENDING" },
        include: { sender: true, project: true },
        orderBy: { createdAt: "desc" }
      } : false,
      _count: {
        select: {
          receivedRequests: { where: { status: "ACCEPTED" } },
          sentRequests: { where: { status: "ACCEPTED" } }
        }
      }
    }
  })

  if (!user) notFound()

  const followersCount = await prisma.follow.count({
    where: { followingId: id }
  })

  const followingCount = await prisma.follow.count({
    where: { followerId: id }
  })

  const isOwnProfile = session?.user?.id === user.id
  const userIsFollowing = !isOwnProfile ? await isFollowing(id) : false

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Profile Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-8">
          <div className="space-y-5">
            <div className="relative w-full aspect-square max-w-[200px] mx-auto lg:mx-0 rounded-[2rem] overflow-hidden border-2 border-border-gro shadow-2xl group">
              {user.image ? (
                <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-muted/10 flex items-center justify-center">
                  <UserIcon className="w-16 h-16 text-muted" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
                {user.role === "SENIOR" && (
                  <span title="Senior Verificado" className="text-amber-500">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                )}
              </div>
              <p className="text-muted font-medium text-sm">@{user.name?.toLowerCase().replace(/\s+/g, '') ?? "username"}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                user.role === "SENIOR" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-accent-gro/10 text-accent-gro border-accent-gro/20"
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-muted font-semibold">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Se unió en {new Date(user.createdAt).toLocaleDateString("es-ES", { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <ProfileClientSection 
              isOwnProfile={isOwnProfile} 
              user={{ id: user.id, name: user.name, image: user.image, bio: (user as any).bio, location: (user as any).location, website: (user as any).website }} 
            />
            {!isOwnProfile && session && (
              <FollowButton userId={user.id} initialIsFollowing={userIsFollowing} />
            )}
            <MentorRequestButton seniorId={user.id} seniorRole={user.role} />
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 space-y-10">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Recursos" value={user.posts.length} icon={<BookOpen className="w-4 h-4" />} />
            <StatCard label="Seguidores" value={followersCount} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Mentorías" value={user._count.receivedRequests + user._count.sentRequests} icon={<MessageSquare className="w-4 h-4" />} />
            <StatCard label="Proyectos" value={user.projects.length} icon={<Star className="w-4 h-4 fill-amber-500 text-amber-500" />} />
          </div>

          {isOwnProfile && (
            <ProfileRequests 
              mentorshipRequests={(user as any).receivedRequests || []} 
              collaborationRequests={(user as any).receivedCollabReqs || []} 
            />
          )}

          <ProfileFeed 
            posts={user.posts} 
            projects={user.projects} 
            activity={[
              ...user.likes.map(l => ({ ...l, type: 'like' as const })),
              ...user.comments.map(c => ({ ...c, type: 'comment' as const }))
            ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())}
            currentUserId={session?.user?.id}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="gro-card p-5 flex items-center justify-between group hover:border-accent-gro transition-all">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
      <div className="text-muted group-hover:text-accent-gro transition-colors">{icon}</div>
    </div>
  )
}
