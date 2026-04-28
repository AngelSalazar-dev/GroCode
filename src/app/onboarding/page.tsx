import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import { updateUserRole } from "@/actions/user"
import { Role } from "@prisma/client"
import { GraduationCap, Briefcase, ArrowRight, CheckCircle2 } from "lucide-react"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  // Skip onboarding if user already has a role (not a fresh signup)
  // We detect this by checking if they came from registration vs login
  // For now, we simply show the onboarding always but block re-selection 
  // by making /onboarding only reachable manually

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_var(--color-accent-gro)_0%,transparent_50%)] opacity-[0.03] -z-10" />

      <div className="max-w-4xl w-full space-y-16 py-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-gro/10 text-accent-gro text-xs font-black uppercase tracking-widest border border-accent-gro/20 mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paso 1 de 1
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">¿Cómo te defines?</h1>
          <p className="text-muted text-xl font-medium max-w-2xl mx-auto">
            Esta selección personaliza tu experiencia. Podrás cambiarla desde tu perfil si evoluciona tu carrera.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form action={async () => {
            "use server"
            await updateUserRole(Role.JUNIOR)
          }}>
            <button type="submit" className="w-full text-left group">
              <div className="gro-card p-10 h-full space-y-8 group-hover:border-indigo-500 group-hover:-translate-y-2 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold tracking-tight group-hover:text-indigo-500 transition-colors">Soy Junior</h3>
                  <ul className="space-y-2 text-sm text-muted font-medium">
                    <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Accede a mentoría personalizada</li>
                    <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Explora recursos curados</li>
                    <li className="flex items-center gap-2"><span className="text-indigo-500">✓</span> Haz preguntas en los canales</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Continuar como Junior <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </form>

          <form action={async () => {
            "use server"
            await updateUserRole(Role.SENIOR)
          }}>
            <button type="submit" className="w-full text-left group">
              <div className="gro-card p-10 h-full space-y-8 group-hover:border-amber-500 group-hover:-translate-y-2 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Briefcase className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold tracking-tight group-hover:text-amber-500 transition-colors">Soy Senior</h3>
                  <ul className="space-y-2 text-sm text-muted font-medium">
                    <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Comparte tu experiencia</li>
                    <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Recibe solicitudes de mentoría</li>
                    <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Gana reputación en la comunidad</li>
                  </ul>
                  <p className="text-xs text-muted/60 italic border-t border-border-gro pt-3">
                    Nota: Tu experiencia real puede ser verificada por el equipo de GroCode para obtener la insignia de Senior verificado.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Continuar como Senior <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
