"use client"

import { signIn } from "next-auth/react"
import { Code2, Loader2, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const registered = searchParams.get("registered")

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    await signIn("github", { callbackUrl: "/feed" })
  }

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email o contraseña incorrectos")
      setIsLoading(false)
    } else {
      router.push("/feed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_var(--color-accent-gro)_0%,transparent_40%)] opacity-[0.05] -z-10" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_var(--color-accent-gro)_0%,transparent_40%)] opacity-[0.05] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] space-y-10"
      >
        <div className="text-center space-y-6">
          <Link href="/" className="inline-block group">
            <img src="/Black Isotype.png" className="w-16 h-16 object-contain dark:hidden group-hover:scale-110 transition-transform" />
            <img src="/White Isotype.png" className="w-16 h-16 object-contain hidden dark:block group-hover:scale-110 transition-transform" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-muted font-medium">Ingresa tus credenciales para acceder</p>
          </div>
        </div>

        <div className="gro-card p-10 space-y-8 shadow-2xl">
          {registered && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-xs font-bold text-center">
              ¡Registro exitoso! Por favor inicia sesión.
            </div>
          )}

          <form onSubmit={handleCredentialsSignIn} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Email</label>
              <input 
                name="email"
                type="email" 
                required
                placeholder="tu@email.com"
                className="w-full bg-muted/5 border border-border-gro rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-accent-gro/10 focus:border-accent-gro outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">Contraseña</label>
                <Link href="#" className="text-[10px] font-bold text-accent-gro hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-muted/5 border border-border-gro rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-accent-gro/10 focus:border-accent-gro outline-none transition-all"
              />
            </div>

            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

            <button 
              disabled={isLoading}
              className="w-full gro-btn gro-btn-primary !py-3.5 !rounded-xl"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar Sesión"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border-gro"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-card-gro px-3 text-muted">O continuar con</span></div>
          </div>

          <button 
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full gro-btn !py-3.5 !rounded-xl flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code2 className="w-5 h-5" />}
            GitHub
          </button>
        </div>

        <p className="text-center text-sm font-medium text-muted">
          ¿No tienes una cuenta? <Link href="/auth/register" className="text-accent-gro font-bold hover:underline">Regístrate gratis</Link>
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Volver al inicio
        </Link>
      </motion.div>
    </div>
  )
}