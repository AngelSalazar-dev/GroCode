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
      title="Error al cargar la publicación"
      message="Hubo un problema al cargar este recurso."
      error={error}
      reset={reset}
    />
  )
}