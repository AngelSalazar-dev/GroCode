"use client"

import { signIn } from "next-auth/react"
import { Code2, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    await signIn("github", { callbackUrl: "/onboarding" })
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
      setError("Email or password incorrect")
      setIsLoading(false)
    } else {
      router.push("/onboarding")
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center pt-20 px-4 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-accent-github/5 to-transparent -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <img src="/isotype.png" alt="GroCode Logo" className="w-16 h-16 object-contain dark:brightness-110 brightness-0 transition-all" />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-light tracking-tight mb-8 text-foreground"
      >
        Sign in to GroCode
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-[340px] space-y-4"
      >
        <div className="gh-box p-6 space-y-6 bg-card-github shadow-xl">
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Username or email address</label>
              <input 
                name="email"
                type="text" 
                required
                className="w-full bg-background border border-border-github rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-accent-github/20 focus:border-accent-github outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold">Password</label>
                <Link href="#" className="text-[11px] text-accent-github hover:underline">Forgot password?</Link>
              </div>
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
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border-github"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card-github px-2 text-muted font-bold">OR</span></div>
          </div>

          <button 
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 gh-button !py-2 !text-sm disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
            Continue with GitHub
          </button>
        </div>

        <div className="gh-box p-4 text-center text-sm">
          <span className="text-muted">New to GroCode? </span>
          <Link href="/auth/register" className="text-accent-github font-semibold hover:underline">Create an account.</Link>
        </div>
      </motion.div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-accent-github border-t-transparent rounded-full" />
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInForm />
    </Suspense>
  )
}