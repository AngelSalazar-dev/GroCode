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
      title="Error al cargar los mentores"
      message="Hubo un problema al cargar la lista de mentores."
      error={error}
      reset={reset}
    />
  )
}