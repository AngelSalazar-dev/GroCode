"use client"

import { useState } from "react"
import PostCard from "@/components/feed/PostCard"
import ProjectCard from "@/components/collaboration/ProjectCard"
import { Briefcase, Activity } from "lucide-react"

interface ProfileFeedProps {
  posts: any[]
  projects: any[]
  activity: any[]
  currentUserId?: string
}

export default function ProfileFeed({ posts, projects, activity, currentUserId }: ProfileFeedProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "activity">("posts")

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-8 border-b border-border-gro pb-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab("posts")}
          className={`text-sm font-black uppercase tracking-widest pb-4 relative transition-colors ${
            activeTab === "posts" ? "text-accent-gro" : "text-muted hover:text-foreground"
          }`}
        >
          Recursos
          {activeTab === "posts" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full"></span>}
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`text-sm font-black uppercase tracking-widest pb-4 relative transition-colors ${
            activeTab === "projects" ? "text-accent-gro" : "text-muted hover:text-foreground"
          }`}
        >
          Proyectos
          {activeTab === "projects" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full"></span>}
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`text-sm font-black uppercase tracking-widest pb-4 relative transition-colors ${
            activeTab === "activity" ? "text-accent-gro" : "text-muted hover:text-foreground"
          }`}
        >
          Actividad
          {activeTab === "activity" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full"></span>}
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === "posts" && (
          <>
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            ) : (
              <EmptyState message="Este usuario aún no ha compartido recursos públicos." />
            )}
          </>
        )}

        {activeTab === "projects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.length > 0 ? (
              projects.map((project) => <ProjectCard key={project.id} project={project} />)
            ) : (
              <div className="md:col-span-2">
                <EmptyState message="No hay proyectos de colaboración activos." icon={<Briefcase className="w-12 h-12 text-muted/20 mx-auto" />} />
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <>
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-gro" />
                  <div className="pl-10 py-2">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
                      {item.type === "like" ? "Le dio like a una publicación" : "Comentó en una publicación"}
                    </p>
                    <PostCard post={item.post} currentUserId={currentUserId} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No hay actividad reciente." icon={<Activity className="w-12 h-12 text-muted/20 mx-auto" />} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="py-24 text-center gro-card border-dashed bg-transparent space-y-4">
      {icon || <Briefcase className="w-12 h-12 text-muted/20 mx-auto" />}
      <p className="text-muted font-medium italic">{message}</p>
    </div>
  )
}
