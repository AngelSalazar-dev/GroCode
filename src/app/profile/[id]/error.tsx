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
      title="Error al cargar el perfil"
      message="Hubo un problema al cargar este perfil."
      error={error}
      reset={reset}
    />
  )
}