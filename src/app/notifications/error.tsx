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
      title="Error al cargar las notificaciones"
      message="Hubo un problema al cargar tus notificaciones."
      error={error}
      reset={reset}
    />
  )
}