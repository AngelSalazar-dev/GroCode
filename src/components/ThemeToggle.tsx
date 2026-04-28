"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/5 border border-border-gro hover:border-accent-gro hover:bg-muted/10 transition-all active:scale-90"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-180 duration-500" />
      ) : (
        <Moon className="w-4 h-4 text-accent-gro animate-in spin-in-90 duration-500" />
      )}
    </button>
  )
}
