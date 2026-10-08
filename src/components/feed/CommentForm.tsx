"use client"

import { useState } from "react"
import { useTransition } from "react"
import { addComment } from "@/actions/interactions"
import { Send, Loader2 } from "lucide-react"

export interface AddedComment {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null; role: string }
}

interface CommentFormProps {
  postId: string
  onCommentAdded?: (comment: AddedComment) => void
}

export default function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      try {
        const comment = await addComment(postId, content)
        setContent("")
        setError("")
        onCommentAdded?.(comment)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al agregar comentario")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          value={content}
          onChange={(e) => { setContent(e.target.value); setError("") }}
          placeholder="Escribe un comentario..."
          maxLength={1000}
          disabled={isPending}
          aria-label="Escribe un comentario"
          aria-invalid={!!error}
          className="w-full bg-muted/5 border border-border-gro rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-gro transition-colors disabled:opacity-50"
        />
        {error && (
          <p className="absolute -bottom-5 left-0 text-[10px] text-rose-700 dark:text-rose-500">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        aria-label="Publicar comentario"
        className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-accent-gro/10 text-accent-gro hover:bg-accent-gro/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  )
}
