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
      title="Error en la postulación"
      message="Hubo un problema al procesar tu postulación como Senior."
      error={error}
      reset={reset}
    />
  )
}