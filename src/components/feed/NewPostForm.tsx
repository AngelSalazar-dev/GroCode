"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CHANNELS } from "@/lib/channels"
import { Send, Link as LinkIcon, Hash, AlertCircle, Loader2 } from "lucide-react"

interface State {
  error?: string
  /** Set on success; the effect below turns it into a navigation. */
  ok?: boolean
}

const initialState: State = {}

/**
 * Wraps the server action so its result becomes form state.
 *
 * Passing the error through the URL was wrong: it was lost on re-submit and
 * the page never rendered it anyway.
 */
async function submit(_prev: State, formData: FormData): Promise<State> {
  const { createPost } = await import("@/actions/posts")
  const result = await createPost(formData)

  // createPost redirects on success, so reaching here means it failed.
  if ("error" in result) return { error: result.error }
  return { ok: true }
}

export default function NewPostForm() {
  const [state, formAction, isPending] = useActionState(submit, initialState)
  const router = useRouter()

  // `createPost` redirects on success, so this is only a safety net.
  useEffect(() => {
    if (state.ok) router.replace("/feed")
  }, [state.ok, router])

  return (
    <form action={formAction} className="space-y-6 gro-card p-8">
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-500 text-sm font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="content"
          className="block text-xs font-black uppercase tracking-widest text-muted mb-3"
        >
          ¿Qué quieres compartir?
        </label>
        <textarea
          id="content"
          name="content"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          aria-describedby={state.error ? "post-error" : undefined}
          className="w-full p-4 bg-muted/5 border border-border-gro rounded-2xl focus:ring-2 focus:ring-accent-gro focus:border-accent-gro transition-all outline-none resize-none text-sm"
          placeholder="Describe el recurso, por qué es útil o qué aprendiste..."
        />
        <p className="text-xs text-muted text-right mt-1">
          Mínimo 10 caracteres
        </p>
      </div>

      <div>
        <label
          htmlFor="channel"
          className="block text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2"
        >
          <Hash className="w-3 h-3" />
          Canal
        </label>
        <select
          id="channel"
          name="channel"
          defaultValue="general"
          className="w-full p-4 bg-muted/5 border border-border-gro rounded-2xl focus:ring-2 focus:ring-accent-gro focus:border-accent-gro transition-all outline-none text-sm font-medium"
        >
          {CHANNELS.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.icon} {ch.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="resourceUrl"
          className="block text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2"
        >
          <LinkIcon className="w-3 h-3" />
          URL del Recurso (opcional)
        </label>
        <input
          id="resourceUrl"
          type="url"
          name="resourceUrl"
          maxLength={500}
          className="w-full p-4 bg-muted/5 border border-border-gro rounded-2xl focus:ring-2 focus:ring-accent-gro focus:border-accent-gro transition-all outline-none text-sm"
          placeholder="https://youtube.com/... o https://blog.com/..."
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 gro-btn gro-btn-primary !py-4 !rounded-2xl !text-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Publicando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Publicar ahora
          </>
        )}
      </button>
    </form>
  )
}