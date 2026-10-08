"use client"

import { useEffect } from "react"
import { RotateCcw, AlertTriangle } from "lucide-react"

interface ErrorFallbackProps {
  title: string
  message: string
  /** Provided by Next.js; calling it re-renders the segment. */
  reset: () => void
  /** Only surfaced in development to make debugging easier. */
  error?: Error & { digest?: string }
}

export default function ErrorFallback({
  title,
  message,
  reset,
  error,
}: ErrorFallbackProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
      <div className="gro-card p-8 max-w-md mx-auto text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-500 flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <p className="text-muted text-sm leading-relaxed">{message}</p>
        </div>

        <button
          onClick={() => reset()}
          className="gro-btn gro-btn-primary !rounded-full !px-8 !py-3 inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reintentar
        </button>

        {error?.digest && (
          <p className="text-[10px] text-muted font-mono">Referencia: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
