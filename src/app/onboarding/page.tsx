import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import OnboardingChoice from "@/components/onboarding/OnboardingChoice"

/**
 * Fresh visitors land straight on this screen.
 *
 * Nothing redirected here before, so the onboarding was unreachable: neither
 * the feed nor sign-in checked the flag, and both sent everyone to /feed.
 *
 * `role` is non-nullable and defaults to JUNIOR, so it cannot signal "has not
 * chosen yet" — `onboardingCompleted` can.
 */
export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user?.id) redirect("/auth/signin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  })

  if (user?.onboardingCompleted) {
    redirect("/feed")
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_var(--color-accent-gro)_0%,transparent_50%)] opacity-[0.03] -z-10" />

      <div className="max-w-4xl w-full space-y-10 py-20">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-gro/10 text-accent-gro text-xs font-black uppercase tracking-widest border border-accent-gro/20">
            Paso 1 de 1
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Bienvenido a GroCode
          </h1>
          <p className="text-muted text-xl font-medium max-w-2xl mx-auto">
            Empezamos como Junior: podrás publicar, comentar y pedir mentoría desde
            el primer momento. Cuando quieras compartir tu experiencia, puedes
            postulate como Senior Verificado.
          </p>
        </div>

        <OnboardingChoice />
      </div>
    </div>
  )
}