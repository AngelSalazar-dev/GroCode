"use client"

import { registerUser } from "@/actions/register"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center pt-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[340px] space-y-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-tight">Join GroCode</h1>
        </div>

        <div className="gh-box p-6 bg-card-github shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Username</label>
              <input 
                name="name"
                type="text" 
                required
                className="w-full bg-background border border-border-github rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-accent-github/20 focus:border-accent-github outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Email address</label>
              <input 
                name="email"
                type="email" 
                required
                className="w-full bg-background border border-border-github rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-accent-github/20 focus:border-accent-github outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Password</label>
              <input 
                name="password"
                type="password" 
                required
                className="w-full bg-background border border-border-github rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-accent-github/20 focus:border-accent-github outline-none"
              />
            </div>

            {error && <p className="text-rose-500 text-xs font-medium">{error}</p>}

            <button 
              disabled={isLoading}
              className="w-full gh-button gh-button-primary !py-2 !text-sm disabled:opacity-70"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <div className="gh-box p-4 text-center text-sm">
          <span className="text-muted">Already have an account? </span>
          <Link href="/auth/signin" className="text-accent-github hover:underline">Sign in.</Link>
        </div>
      </motion.div>
    </div>
  )
}
