"use client"

import { useState } from "react"
import { Code2, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate sending email (in production, this would call an API)
    await new Promise(r => setTimeout(r, 1500))
    
    setSent(true)
    setIsLoading(false)
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
          <Link href="/auth/signin" className="inline-block group">
            <img src="/Black Isotype.png" className="w-16 h-16 object-contain dark:hidden group-hover:scale-110 transition-transform" />
            <img src="/White Isotype.png" className="w-16 h-16 object-contain hidden dark:block group-hover:scale-110 transition-transform" />
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Recuperar contraseña</h1>
            <p className="text-muted font-medium">Ingresa tu email y te enviaremos las instrucciones</p>
          </div>
        </div>

        <div className="gro-card p-10 space-y-8 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium text-muted">
                Si existe una cuenta con <strong>{email}</strong>, recibirás un email con las instrucciones para recuperar tu contraseña.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-muted/5 border border-border-gro rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-accent-gro/10 focus:border-accent-gro outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full gro-btn gro-btn-primary !py-3.5 !rounded-xl"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar instrucciones"}
              </button>
            </form>
          )}
        </div>

        <Link href="/auth/signin" className="flex items-center justify-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
        </Link>
      </motion.div>
    </div>
  )
}
