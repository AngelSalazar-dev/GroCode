import { Loader2 } from "lucide-react"

export default function RouteLoading({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-accent-gro" />
      <p className="text-sm text-muted font-medium">{label}…</p>
    </div>
  )
}