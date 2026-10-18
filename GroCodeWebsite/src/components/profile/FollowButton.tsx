"use client"

import { useState, useTransition } from "react"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toggleFollow } from "@/actions/follow"

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
}

export default function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleFollow = () => {
    startTransition(async () => {
      try {
        await toggleFollow(userId)
        setIsFollowing(!isFollowing)
      } catch (e) {
        console.error(e)
      }
    })
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isPending}
      className={`gro-btn !rounded-full !py-2.5 !px-6 font-bold text-sm flex items-center gap-2 w-full justify-center ${
        isFollowing 
          ? "bg-muted/10 text-muted hover:bg-rose-500/10 hover:text-rose-500 border border-border-gro hover:border-rose-500/20" 
          : "gro-btn-primary"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Siguiendo
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Seguir
        </>
      )}
    </button>
  )
}
