"use client"

import { MentorshipRequest, CollaborationRequest, User, Project } from "@/generated-v4/client"
import { useTransition } from "react"
import { handleMentorshipRequest, handleCollaborationRequest } from "@/actions/requests"
import { Check, X, Star, Briefcase, Loader2 } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { toast } from "sonner"

interface ProfileRequestsProps {
  mentorshipRequests: (MentorshipRequest & { junior: User })[]
  collaborationRequests: (CollaborationRequest & { sender: User, project: Project })[]
}

export default function ProfileRequests({ mentorshipRequests, collaborationRequests }: ProfileRequestsProps) {
  const [isPending, startTransition] = useTransition()

  const onMentorshipAction = (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    startTransition(async () => {
      try {
        await handleMentorshipRequest(id, status)
        toast.success(status === 'ACCEPTED' ? "Solicitud aceptada" : "Solicitud rechazada")
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  const onCollabAction = (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    startTransition(async () => {
      try {
        await handleCollaborationRequest(id, status)
        toast.success(status === 'ACCEPTED' ? "Colaboración aprobada" : "Solicitud rechazada")
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  if (mentorshipRequests.length === 0 && collaborationRequests.length === 0) return null

  return (
    <div className="space-y-6">
      {mentorshipRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Solicitudes de Mentoría</h3>
          </div>
          <div className="grid gap-4">
            {mentorshipRequests.map(req => (
              <div key={req.id} className="gro-card p-4 space-y-3 bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-border-gro">
                      {req.junior.image ? <img src={req.junior.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted/10" />}
                    </div>
                    <span className="text-sm font-bold">{req.junior.name}</span>
                  </div>
                  <span className="text-[10px] text-muted font-bold">{timeAgo(req.createdAt)}</span>
                </div>
                <p className="text-xs text-muted line-clamp-2 italic">"{req.message || "Quiere que seas su mentor..."}"</p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={isPending}
                    onClick={() => onMentorshipAction(req.id, 'ACCEPTED')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} ACEPTAR
                  </button>
                  <button 
                    disabled={isPending}
                    onClick={() => onMentorshipAction(req.id, 'REJECTED')}
                    className="flex-1 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" /> RECHAZAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {collaborationRequests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent-gro" />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted">Postulaciones a Proyectos</h3>
          </div>
          <div className="grid gap-4">
            {collaborationRequests.map(req => (
              <div key={req.id} className="gro-card p-4 space-y-3 bg-muted/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{req.sender.name}</span>
                    <span className="text-[10px] text-muted">en</span>
                    <span className="text-xs font-black text-accent-gro truncate max-w-[120px]">{req.project.title}</span>
                  </div>
                  <span className="text-[10px] text-muted font-bold">{timeAgo(req.createdAt)}</span>
                </div>
                <p className="text-xs text-muted line-clamp-2 italic">"{req.message || "Quiere colaborar en tu proyecto..."}"</p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={isPending}
                    onClick={() => onCollabAction(req.id, 'ACCEPTED')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} APROBAR
                  </button>
                  <button 
                    disabled={isPending}
                    onClick={() => onCollabAction(req.id, 'REJECTED')}
                    className="flex-1 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" /> RECHAZAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
