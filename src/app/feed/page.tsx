import { prisma } from "@/lib/prisma"
import FeedList from "@/components/feed/FeedList"
import Link from "next/link"
import { Plus, Flame, Star, Clock } from "lucide-react"

export default async function FeedPage() {
  const posts = await prisma.post.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row gap-8 py-8 px-4">
      {/* Sidebar Izquierdo - Navigation */}
      <div className="hidden lg:block w-64 shrink-0 space-y-6">
        <div className="space-y-2">
           <h3 className="px-3 text-xs font-semibold text-muted uppercase tracking-wider">Explore</h3>
           <nav className="space-y-1">
              <Link href="/feed" className="flex items-center gap-3 px-3 py-2 bg-accent-github/10 text-accent-github rounded-md font-bold transition-all">
                <Flame className="w-4 h-4" /> Trending
              </Link>
              <Link href="/mentors" className="flex items-center gap-3 px-3 py-2 hover:bg-card-github-hover rounded-md transition-all text-muted hover:text-foreground">
                <Star className="w-4 h-4" /> Top Mentors
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 hover:bg-card-github-hover rounded-md transition-all text-muted hover:text-foreground">
                <Clock className="w-4 h-4" /> Latest
              </Link>
           </nav>
        </div>

        <div className="gh-box p-4 bg-accent-github/5 border-accent-github/20">
           <h4 className="text-sm font-bold mb-2">Build your network</h4>
           <p className="text-xs text-muted mb-3">Connect with experts and accelerate your career growth.</p>
           <Link href="/mentors" className="text-xs font-bold text-accent-github hover:underline">Find a mentor →</Link>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1">
        <div className="mb-6 flex items-center justify-between border-b border-border-github pb-4">
           <h1 className="text-xl font-bold">Community Feed</h1>
           <Link href="/feed/new" className="gh-button gh-button-primary !py-1.5 !text-xs">
             <Plus className="w-3 h-3" /> New Post
           </Link>
        </div>
        <FeedList posts={posts} />
      </div>

      {/* Sidebar Derecho - Recommendations */}
      <div className="hidden xl:block w-72 shrink-0 space-y-6">
         <div className="gh-box p-4 space-y-4">
            <h3 className="text-sm font-bold">Announcements</h3>
            <div className="space-y-3">
               <div className="text-xs">
                  <p className="font-bold hover:text-accent-github cursor-pointer">GroCode Beta v0.2 is live!</p>
                  <p className="text-muted">Explore the new mentoring request system.</p>
               </div>
               <div className="text-xs border-t border-border-github pt-3">
                  <p className="font-bold hover:text-accent-github cursor-pointer">Community Spotlight</p>
                  <p className="text-muted">Meet the top mentors of this month.</p>
               </div>
            </div>
         </div>

         <div className="text-[11px] text-muted flex flex-wrap gap-x-3 gap-y-1 px-2">
            <span>About</span>
            <span>Terms</span>
            <span>Privacy</span>
            <span>Docs</span>
            <span>GroCode © 2026</span>
         </div>
      </div>
    </div>
  )
}
