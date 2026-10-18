"use client"

import { registerUser } from "@/actions/register"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      const result = await registerUser(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        router.push("/auth/signin?registered=true")
      }
    } catch (err) {
      console.error(err)
      setError("Ocurrió un error inesperado. Inténtalo de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
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
            <h1 className="text-3xl font-black tracking-tight">Crea tu cuenta</h1>
            <p className="text-muted font-medium">Únete a la comunidad de GroCode</p>
          </div>
        </div>

        <div className="gro-card p-10 space-y-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Nombre de usuario</label>
              <input 
                name="name"
                type="text" 
                required
                placeholder="Coder123"
                className="w-full bg-muted/5 border border-border-gro rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-accent-gro/10 focus:border-accent-gro outline-none transition-all"
              />
            </div>
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
              <label className="text-xs font-bold uppercase tracking-wider text-muted">Contraseña</label>
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
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-medium text-muted">
          ¿Ya tienes una cuenta? <Link href="/auth/signin" className="text-accent-gro font-bold hover:underline">Inicia sesión</Link>
        </p>

        <Link href="/" className="flex items-center justify-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Volver al inicio
        </Link>
      </motion.div>
    </div>
  )
}
