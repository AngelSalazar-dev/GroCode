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
      title="Error al cargar el roadmap"
      message="Hubo un problema al cargar la ruta de aprendizaje."
      error={error}
      reset={reset}
    />
  )
}