"use client"

import { useState, useTransition, useOptimistic } from "react"
import { toggleFollow } from "@/actions/follow"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"

interface FollowButtonProps {
  targetUserId: string
  initialFollowing: boolean
  isLoggedIn: boolean
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
  isLoggedIn,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(initialFollowing)
  const [error, setError] = useState("")

// React's useOptimistic derives the payload type from the reducer's second
  // parameter, so it is declared even though a toggle carries no payload.
  const [optimisticFollowing, applyOptimistic] = useOptimistic(
    confirmed,
    (state: boolean, _update: null) => !state
  )

  const handleClick = () => {
    setError("")
    startTransition(async () => {
      applyOptimistic(null)
      const result = await toggleFollow(targetUserId)

      if ("error" in result) {
        setError(result.error)
        return // optimistic value rolls back when the transition settles
      }
      setConfirmed(result.following)
    })
  }

  if (!isLoggedIn) {
    return (
      <a
        href="/auth/signin"
        className="gro-btn gro-btn-primary !rounded-full !px-6 !py-2.5 w-full inline-flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" /> Inicia sesión para seguir
      </a>
    )
  }

  const following = optimisticFollowing

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={following}
        className={`w-full !rounded-full !px-6 !py-2.5 inline-flex items-center justify-center gap-2 ${
          following
            ? "gro-btn !bg-muted/10 !text-muted !border-muted/20"
            : "gro-btn gro-btn-primary"
        }`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : following ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {isPending ? "Actualizando..." : following ? "Siguiendo" : "Seguir"}
      </button>
      {error && (
        <p role="alert" className="text-[11px] text-rose-700 dark:text-rose-500 text-center">
          {error}
        </p>
      )}
    </div>
  )
}