"use client"

import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import ThemeToggle from "./ThemeToggle"
import NotificationPanel from "./notifications/NotificationPanel"
import AccountMenu from "./nav/AccountMenu"

const NAV_LINKS = [
  { href: "/feed", label: "Dashboard" },
  { href: "/mentors", label: "Mentores" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/guardados", label: "Guardados" },
] as const

export default function NavbarClient() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isLoggedIn = !!session
  const isAdmin = session?.user?.role === "ADMIN"

  // Staff get an extra destination; regular users never see it.
  const links = isAdmin
    ? [...NAV_LINKS, { href: "/admin/applications", label: "Panel" } as const]
    : NAV_LINKS

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  // Close the drawer whenever the route changes, adjusted during render
  // rather than in an effect.
  const [seenPath, setSeenPath] = useState(pathname)
  if (pathname !== seenPath) {
    setSeenPath(pathname)
    setMenuOpen(false)
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <div className="flex items-center gap-3 lg:gap-8">
        {isLoggedIn && (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="md:hidden p-2 min-h-11 min-w-11 flex items-center justify-center -ml-2 rounded-full hover:bg-muted/10 text-muted shrink-0"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group shrink-0 min-h-11">
          <span className="relative w-8 h-8">
            <Image
              src="/isotype-black.png"
              alt=""
              width={32}
              height={32}
              className="w-full h-full object-contain dark:hidden group-hover:scale-110 transition-transform"
              priority
            />
            <Image
              src="/isotype-white.png"
              alt=""
              width={32}
              height={32}
              className="w-full h-full object-contain hidden dark:block group-hover:scale-110 transition-transform"
              priority
            />
          </span>
          <span className="font-black text-xl tracking-tight">GroCode</span>
        </Link>

        {isLoggedIn && (
          <nav aria-label="Principal" className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`text-sm font-semibold px-3 py-2 min-h-11 flex items-center rounded-lg transition-all ${
                  isActive(link.href)
                    ? "text-accent-gro bg-accent-gro/10"
                    : "text-muted hover:text-foreground hover:bg-muted/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {isLoggedIn && session?.user?.id ? (
          <>
            <NotificationPanel />
            <AccountMenu
              user={{
                id: session.user.id,
                name: session.user.name,
                image: session.user.image,
                role: session.user.role,
              }}
            />
          </>
        ) : (
          /* Always visible: hiding these below `sm` left signed-out mobile
             visitors with no route to the auth pages at all. */
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/signin"
              className="text-sm font-bold min-h-11 min-w-11 flex items-center justify-center hover:text-accent-gro transition-colors whitespace-nowrap"
            >
              Ingresar
            </Link>
            <Link
              href="/auth/register"
              className="gro-btn gro-btn-primary min-h-11 min-w-11 flex items-center justify-center !py-2 !px-4 sm:!px-5 !text-xs sm:!text-sm !rounded-full whitespace-nowrap"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>

      {/* Mobile drawer: without this the nav links are unreachable below md. */}
      {isLoggedIn && menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Navegación móvil"
          className="md:hidden absolute inset-x-0 top-16 z-40 border-b border-border-gro bg-background/95 backdrop-blur-xl px-6 py-3"
        >
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block py-3 text-sm font-bold transition-colors border-b border-border-gro/50 last:border-b-0 ${
                    isActive(link.href)
                      ? "text-accent-gro"
                      : "text-muted hover:text-accent-gro"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}