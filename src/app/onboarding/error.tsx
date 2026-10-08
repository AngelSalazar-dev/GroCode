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
      title="Error en la configuración inicial"
      message="Hubo un problema al guardar tu selección de rol."
      error={error}
      reset={reset}
    />
  )
}