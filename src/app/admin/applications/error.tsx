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
      title="Error en el panel"
      message="Hubo un problema al cargar la revisión de postulaciones."
      error={error}
      reset={reset}
    />
  )
}