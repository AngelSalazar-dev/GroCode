import Link from "next/link"
import { Compass } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="text-center space-y-8 max-w-lg">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-gro/10 text-accent-gro flex items-center justify-center border border-accent-gro/20">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          <p className="text-6xl font-black tracking-tight text-muted/30">404</p>
          <h1 className="text-3xl font-black tracking-tight">No encontramos esa página</h1>
          <p className="text-muted font-medium leading-relaxed">
            El enlace puede estar roto o el recurso que buscas ya no está disponible.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/feed" className="gro-btn gro-btn-primary !rounded-full !px-8 !py-3">
            Ir al feed
          </Link>
          <Link href="/" className="gro-btn !rounded-full !px-8 !py-3">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}