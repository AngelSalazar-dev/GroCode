"use client"

import { Project, User, Skill } from "@/generated-v4/client"
import { motion } from "framer-motion"
import { Users, Target, Calendar, MessageCircle, Send, Loader2, Check } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { createCollaborationRequest } from "@/actions/collaboration"
import { useState, useTransition } from "react"

interface ProjectCardProps {
  project: Project & {
    owner: Partial<User>
    skills: Skill[]
    _count: {
      collaborators: number
      requests: number
    }
  }
  currentUserId?: string
  hasRequested?: boolean
}

export default function ProjectCard({ project, currentUserId, hasRequested = false }: ProjectCardProps) {
  const [isPending, startTransition] = useTransition()
  const [requested, setRequested] = useState(hasRequested)
  const [error, setError] = useState("")

  const isOwner = currentUserId === project.ownerId
  const isCollaborator = false // TODO: check if user is collaborator

  const handleApply = () => {
    if (!currentUserId) return
    setError("")
    startTransition(async () => {
      try {
        await createCollaborationRequest(project.id)
        setRequested(true)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="gro-card p-6 space-y-4 hover:border-accent-gro/50 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-bold group-hover:text-accent-gro transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted font-medium">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {project._count.collaborators} colaboradores
            </span>
            <span className="w-1 h-1 rounded-full bg-muted/30" />
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              hace {timeAgo(project.createdAt)}
            </span>
          </div>
        </div>
        <div className="bg-accent-gro/10 text-accent-gro px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
          {project.status}
        </div>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {project.skills.map((skill) => (
          <span
            key={skill.id}
            className="px-2.5 py-1 bg-muted/5 border border-border-gro rounded-lg text-[10px] font-bold text-muted group-hover:border-accent-gro/20 group-hover:text-foreground transition-all"
          >
            {skill.name}
          </span>
        ))}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-border-gro/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted/10 border border-border-gro overflow-hidden">
            {project.owner.image ? (
              <img src={project.owner.image} alt={project.owner.name || ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                {project.owner.name?.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-xs font-bold">{project.owner.name}</span>
        </div>
        
        {!isOwner && currentUserId && (
          <div className="flex flex-col items-end gap-1">
            <button 
              onClick={handleApply}
              disabled={isPending || requested || isCollaborator}
              className={`gro-btn !py-2 !px-4 !text-xs !rounded-full flex items-center gap-2 ${
                requested || isCollaborator 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : "gro-btn-primary"
              }`}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : requested || isCollaborator ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isCollaborator ? "Colaborador" : requested ? "Solicitud enviada" : "Postularme"}
            </button>
            {error && <span className="text-[10px] text-rose-500 font-medium">{error}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}
