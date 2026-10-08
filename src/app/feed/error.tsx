"use client"

import ErrorFallback from "@/components/ErrorFallback"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      title="Error al cargar el feed"
      message="Hubo un problema al cargar tus publicaciones."
      error={error}
      reset={reset}
    />
  )
}