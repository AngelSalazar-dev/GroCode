import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import MentorRequestButton from "@/components/mentorship/MentorRequestButton"
import { ShieldCheck, User as UserIcon, Calendar, Github, MapPin, Link as LinkIcon } from "lucide-react"
import PostCard from "@/components/feed/PostCard"

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  return (
    <div className="max-w-[1280px] mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
      {/* Sidebar - Perfil Estilo GitHub */}
      <div className="w-full md:w-72 shrink-0 space-y-6">
        <div className="space-y-4">
          <div className="w-full aspect-square rounded-full border-2 border-border-github bg-card-github overflow-hidden relative group">
             {user.image ? (
               <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
             ) : (
               <UserIcon className="w-full h-full p-12 text-muted" />
             )}
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-xs font-bold">Edit profile</span>
             </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold leading-tight">{user.name}</h1>
            <p className="text-muted text-lg font-light">@{user.name?.toLowerCase().replace(/\s/g, '') || "username"}</p>
          </div>
        </div>

        <button className="w-full gh-button !py-1.5 font-bold text-sm">Edit profile</button>

        <div className="space-y-3 text-sm">
           <p className="text-foreground leading-relaxed">
             Full-stack developer passionate about building scalable technical mentoring platforms.
           </p>
           
           <div className="space-y-1 text-muted">
              <div className="flex items-center gap-2 hover:text-accent-github cursor-pointer">
                <MapPin className="w-4 h-4" />
                <span>Remote / Global</span>
              </div>
              <div className="flex items-center gap-2 hover:text-accent-github cursor-pointer">
                <LinkIcon className="w-4 h-4" />
                <span className="font-semibold">grocode.dev</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}</span>
              </div>
           </div>
        </div>

        <div className="border-t border-border-github pt-4">
           <h3 className="text-sm font-bold mb-2">Role</h3>
           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              user.role === "SENIOR" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-accent-github/10 text-accent-github border-accent-github/20"
            }`}>
              {user.role}
            </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <div className="flex items-center gap-4 border-b border-border-github">
           <button className="pb-3 border-b-2 border-orange-500 text-sm font-bold px-4">Resources</button>
           <button className="pb-3 text-sm text-muted px-4 hover:bg-muted/5 transition-colors">Mentorships</button>
           <button className="pb-3 text-sm text-muted px-4 hover:bg-muted/5 transition-colors">Projects</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shared resources</h2>
            <MentorRequestButton seniorId={user.id} seniorRole={user.role} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {user.posts.length > 0 ? (
              user.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-border-github rounded-lg">
                <p className="text-muted italic">This user hasn't shared any resources yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
