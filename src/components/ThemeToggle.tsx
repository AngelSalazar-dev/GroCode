"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useSyncExternalStore } from "react"

// Canonical "is hydrated" check: the client snapshot is true and the server
// snapshot is false, so the first client render matches the server HTML.
const emptySubscribe = () => () => {}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 min-h-11 min-w-11 flex items-center justify-center rounded-full bg-muted/5 border border-border-gro hover:border-accent-gro hover:bg-muted/10 transition-all active:scale-90"
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-700 dark:text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-accent-gro" />
      )}
    </button>
  )
}
