import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import { notFound } from "next/navigation"
import MentorRequestButton from "@/components/mentorship/MentorRequestButton"
import ProfileClientSection from "@/components/profile/ProfileClientSection"
import PostCard from "@/components/feed/PostCard"
import { ShieldCheck, User as UserIcon, Calendar, MapPin, Link as LinkIcon, MessageSquare, Briefcase, BookOpen, Users, Star } from "lucide-react"

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      posts: {
        include: { author: true },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!user) notFound()

  const isOwnProfile = session?.user?.id === user.id

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

          {(user as any).bio && (
            <p className="text-sm font-medium leading-relaxed text-foreground/80">{(user as any).bio}</p>
          )}

          <div className="space-y-2.5">
            {(user as any).location && (
              <div className="flex items-center gap-3 text-sm text-muted font-semibold">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{(user as any).location}</span>
              </div>
            )}
            {(user as any).website && (
              <a href={(user as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-accent-gro font-semibold hover:underline">
                <LinkIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{(user as any).website.replace("https://", "")}</span>
              </a>
            )}
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
            <MentorRequestButton seniorId={user.id} seniorRole={user.role} />
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 space-y-10">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Recursos" value={user.posts.length} icon={<BookOpen className="w-4 h-4" />} />
            <StatCard label="Seguidores" value={245} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Mentorías" value={12} icon={<MessageSquare className="w-4 h-4" />} />
            <StatCard label="Reputación" value="4.9" icon={<Star className="w-4 h-4 fill-amber-500 text-amber-500" />} />
          </div>

          {/* Tabs + Posts */}
          <div className="space-y-8">
            <div className="flex items-center gap-8 border-b border-border-gro pb-0">
              <button className="text-sm font-black uppercase tracking-widest text-accent-gro pb-4 relative">
                Recursos
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full"></span>
              </button>
              <button className="text-sm font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors pb-4">
                Proyectos
              </button>
              <button className="text-sm font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors pb-4">
                Actividad
              </button>
            </div>

            <div className="space-y-6">
              {user.posts.length > 0 ? (
                user.posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="py-24 text-center gro-card border-dashed bg-transparent space-y-4">
                  <Briefcase className="w-12 h-12 text-muted/20 mx-auto" />
                  <p className="text-muted font-medium italic">Este usuario aún no ha compartido recursos públicos.</p>
                </div>
              )}
            </div>
          </div>
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
