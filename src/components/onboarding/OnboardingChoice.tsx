"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Briefcase, ArrowRight, Loader2 } from "lucide-react"
import { setOnboardingRole } from "@/actions/user"

export default function OnboardingChoice() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const continueAsJunior = () => {
    setError("")
    startTransition(async () => {
      try {
        await setOnboardingRole()
        router.push("/feed")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar")
      }
    })
  }

  return (
    <div className="space-y-4">
      <button
        onClick={continueAsJunior}
        disabled={isPending}
        className="gro-card p-8 w-full text-left border-indigo-500/30 hover:border-indigo-500 transition-colors disabled:opacity-60"
      >
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-3 min-w-0">
            <h2 className="text-xl font-bold text-indigo-500">
              Empezar como Junior
            </h2>
            <ul className="space-y-1.5 text-sm text-muted font-medium">
              <li>✓ Publica y comenta desde el primer momento</li>
              <li>✓ Pide mentoría a los mentores verificados</li>
              <li>✓ Guarda recursos para consultarlos después</li>
            </ul>
          </div>
          <span className="ml-auto shrink-0 inline-flex items-center gap-2 text-sm font-bold text-indigo-500">
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continuar <ArrowRight className="w-4 h-4" />
              </>
            )}
          </span>
        </div>
      </button>

      <div className="gro-card p-8 border-amber-500/30">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shrink-0">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-3 min-w-0">
            <h2 className="text-xl font-bold text-amber-700 dark:text-amber-500">
              Ya tengo experiencia para ser mentor
            </h2>
            <p className="text-sm text-muted font-medium">
              El rol Senior se concede tras revisar tu perfil, para que la
              insignia signifique algo. Puedes enviar tu postulación ahora y
              seguir usando la plataforma como Junior mientras tanto.
            </p>
            <Link
              href="/apply-senior"
              className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-500 hover:underline mt-2"
            >
              Postularme como Senior <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-500 font-medium text-center">
          {error}
        </p>
      )}
    </div>
  )
}