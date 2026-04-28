import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { updateUserRole } from "@/actions/user"
import { Role } from "@prisma/client"
import { GraduationCap, Briefcase } from "lucide-react"

export default async function OnboardingPage() {
  const session = await auth()

  if (!session) redirect("/auth/signin")
  
  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4 tracking-tight">Bienvenido a GroCode</h1>
        <p className="text-muted">Para comenzar, dinos cuál es tu perfil actual. Esto nos ayudará a personalizar tu experiencia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form action={async () => {
          "use server"
          await updateUserRole(Role.JUNIOR)
        }}>
          <button className="w-full p-8 gh-box bg-card-github text-left hover:border-accent-github transition-all group active:scale-95">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
              < GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-accent-github transition-colors">Soy Junior</h3>
            <p className="text-sm text-muted leading-relaxed">Busco aprender, recibir mentoría y encontrar recursos para acelerar mi aprendizaje.</p>
          </button>
        </form>

        <form action={async () => {
          "use server"
          await updateUserRole(Role.SENIOR)
        }}>
          <button className="w-full p-8 gh-box bg-card-github text-left hover:border-amber-500 transition-all group active:scale-95">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-500 transition-colors">Soy Senior</h3>
            <p className="text-sm text-muted leading-relaxed">Quiero compartir mi experiencia, mentorear a otros y contribuir a la comunidad.</p>
          </button>
        </form>
      </div>
    </div>
  )
}
