import MatchmakingFeed from "@/components/collaboration/MatchmakingFeed"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { Plus, Rocket } from "lucide-react"
import Link from "next/link"

export default async function CollaborationPage() {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-accent-gro" />
            <h1 className="text-3xl font-black tracking-tight">Proyectos de Colaboración</h1>
          </div>
          
          <Link 
            href="/collaboration/new"
            className="flex items-center gap-2 bg-accent-gro hover:opacity-90 text-background px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-accent-gro/20"
          >
            <Plus className="w-5 h-5" />
            Crear Proyecto
          </Link>
        </div>

        <MatchmakingFeed />
      </div>
    </div>
  )
}
