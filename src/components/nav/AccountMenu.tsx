"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { LogOut, Settings, ShieldCheck } from "lucide-react"
import { logoutAction } from "@/actions/auth"
import UserAvatar from "@/components/UserAvatar"

interface AccountMenuProps {
  user: { id: string; name?: string | null; image?: string | null; role?: string }
}

/**
 * Single account control that works at every viewport.
 *
 * Previously the avatar and a second LogoutButton were rendered in separate
 * clusters and the sign-in links were hidden below `sm`, so a signed-out
 * visitor on a phone had no way to reach the auth pages at all.
 */
export default function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close after any navigation. Adjusted during render rather than in an
  // effect, which would cost an extra render pass on every route change.
  const [seenPath, setSeenPath] = useState(pathname)
  if (pathname !== seenPath) {
    setSeenPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onClickOutside)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onClickOutside)
    }
  }, [open])

  const isAdmin = user.role === "ADMIN"

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de cuenta"
        className="w-8 h-8 min-h-11 min-w-11 rounded-full bg-muted/20 overflow-hidden border border-border-gro hover:border-accent-gro transition-colors shrink-0"
      >
        {/* `UserAvatar`, y no un `<Image>` propio: `User.image` lo pone el
            usuario o GitHub, asi que cualquier host es posible y el
            optimizador de Next lo rechazaria. El componente ya lleva
            `unoptimized` y el motivo escrito; duplicarlo aqui es como se coló
            el bug. */}
        <UserAvatar src={user.image} name={user.name} size={32} className="w-full h-full" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Cuenta"
          className="absolute right-0 top-11 w-56 gro-card shadow-2xl z-50 overflow-hidden py-1"
        >
          <div className="px-4 py-2.5 border-b border-border-gro">
            <p className="text-sm font-bold truncate">
              {user.name ?? "Tu cuenta"}
            </p>
            <p className="text-[10px] uppercase tracking-widest font-black text-muted">
              {isAdmin ? "Administrador" : (user.role ?? "")}
            </p>
          </div>

          <Link
            href={`/profile/${user.id}`}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground hover:bg-muted/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Tu perfil
          </Link>

          {isAdmin && (
            <Link
              href="/admin/applications"
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-muted hover:text-foreground hover:bg-muted/5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Panel de postulaciones
            </Link>
          )}

          <form action={logoutAction} className="border-t border-border-gro">
            <button
              type="submit"
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-muted hover:text-hover:-700 dark:hover:text-hover:-500 hover:bg-muted/5 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}