"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createMentorshipRequest,
  respondToMentorshipRequest,
} from "@/actions/mentorship"
import { UserCheck, UserPlus, Loader2, X, Check, MessageSquareQuote } from "lucide-react"
import type { RequestStatus } from "@/generated-v2/client"

interface IncomingRequest {
  id: string
  juniorId: string
  juniorName: string | null
  message?: string | null
}

interface RequestButtonClientProps {
  seniorId: string
  /** Status of the request the viewer already sent, if any. */
  sentRequestStatus: RequestStatus | null
  /** Present when the viewer is the senior receiving a pending request. */
  incomingRequest: IncomingRequest | null
}

const SENT_LABEL: Record<RequestStatus, string> = {
  PENDING: "Solicitud Pendiente",
  ACCEPTED: "Mentoría Aceptada",
  REJECTED: "Solicitud Rechazada",
}

export default function RequestButtonClient({
  seniorId,
  sentRequestStatus,
  incomingRequest,
}: RequestButtonClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<RequestStatus | null>(sentRequestStatus)
  const [error, setError] = useState("")

  const handleRequest = () => {
    setError("")
    startTransition(async () => {
      const result = await createMentorshipRequest(seniorId)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setStatus(result.status)
    })
  }

  const respond = (accept: boolean) => {
    if (!incomingRequest) return
    setError("")
    startTransition(async () => {
      const result = await respondToMentorshipRequest(incomingRequest.id, accept)
      if ("error" in result) {
        setError(result.error)
        return
      }
      // Refresh the server components instead of reloading the whole page,
      // which would drop scroll position and client state.
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {incomingRequest ? (
        <div className="gro-card p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted">
              <span className="font-bold text-foreground">
                {incomingRequest.juniorName ?? "Un Junior"}
              </span>{" "}
              te ha enviado una solicitud de mentoría.
            </p>
            {incomingRequest.message && (
              <blockquote className="flex gap-2 text-xs text-muted/90 italic border-l-2 border-border-gro pl-2.5 pt-1">
                <MessageSquareQuote className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                <span className="break-words">{incomingRequest.message}</span>
              </blockquote>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => respond(true)}
              disabled={isPending}
              className="flex-1 gro-btn gro-btn-primary !py-2 !rounded-full !text-xs inline-flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Aceptar
            </button>
            <button
              onClick={() => respond(false)}
              disabled={isPending}
              className="flex-1 gro-btn !py-2 !rounded-full !text-xs inline-flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Rechazar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleRequest}
          disabled={isPending || status === "PENDING" || status === "ACCEPTED"}
          className={`w-full gro-btn !rounded-full !px-6 !py-2.5 inline-flex items-center justify-center gap-2 ${
            status === "ACCEPTED"
              ? "!bg-emerald-500/10 !text-!-700 dark:!text-!-500 !border-emerald-500/20 cursor-default"
              : status === "PENDING"
                ? "!bg-muted/10 !text-muted !border-muted/20 cursor-not-allowed"
                : "gro-btn-primary"
          }`}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {isPending ? "Enviando..." : status ? SENT_LABEL[status] : "Solicitar Mentoría"}
        </button>
      )}

      {status === "REJECTED" && (
        <p className="text-[11px] text-muted text-center">
          Puedes enviar una nueva solicitud si lo deseas.
        </p>
      )}

      {error && (
        <p role="alert" className="text-[11px] text-rose-700 dark:text-rose-500 text-center">
          {error}
        </p>
      )}
    </div>
  )
}