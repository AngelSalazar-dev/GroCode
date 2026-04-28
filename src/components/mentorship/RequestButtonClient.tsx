"use client"

import { useTransition } from "react"
import { createMentorshipRequest } from "@/actions/mentorship"
import { UserCheck, UserPlus, Loader2 } from "lucide-react"

interface RequestButtonClientProps {
  seniorId: string
  hasPendingRequest: boolean
}

export default function RequestButtonClient({ seniorId, hasPendingRequest }: RequestButtonClientProps) {
  const [isPending, startTransition] = useTransition()

  const handleRequest = () => {
    startTransition(async () => {
      try {
        await createMentorshipRequest(seniorId)
      } catch (error: any) {
        alert(error.message)
      }
    })
  }

  if (hasPendingRequest) {
    return (
      <button 
        disabled 
        className="gro-btn !bg-muted/10 !text-muted !border-muted/20 !rounded-full opacity-80 cursor-not-allowed"
      >
        <UserCheck className="w-4 h-4" />
        Solicitud Pendiente
      </button>
    )
  }

  return (
    <button
      onClick={handleRequest}
      disabled={isPending}
      className="gro-btn gro-btn-primary !rounded-full !px-6 !py-2.5 shadow-xl shadow-accent-gro/10"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isPending ? "Enviando..." : "Solicitar Mentoría"}
    </button>
  )
}
