"use client"

import { useState } from "react"

export default function Error() {
  const [retried, setRetried] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white rounded-lg p-6 shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Perfil no encontrado</h2>
        <p className="text-muted mb-6">
          El perfil que buscas no existe o ha sido eliminado.
        </p>
        <button
          onClick={() => setRetried(true)}
          className="gro-btn gro-btn-primary py-3 px-8 text-lg rounded-full"
        >
          Reintentar
        </button>
        {retried && (
          <p className="text-center text-muted mt-4">
            Si el problema persiste, por favor vuelve a la página principal.
          </p>
        )}
      </div>
    </div>
  )
}