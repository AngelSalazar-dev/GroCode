import Link from "next/link"
import { auth } from "@/auth/auth"
import { User as UserIcon, Search } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import LogoutButton from "./auth/LogoutButton"
import NotificationPanel from "./notifications/NotificationPanel"

import { prisma } from "@/lib/prisma"

export default async function Navbar() {
  const session = await auth()
  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true }
    })
  }

  return (
    <nav className="border-b border-border-gro bg-background/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8">
              {/* Light mode: black isotype, Dark mode: white isotype */}
              <img 
                src="/Black Isotype.png" 
                alt="GroCode" 
                className="w-full h-full object-contain dark:hidden group-hover:scale-110 transition-transform" 
              />
              <img 
                src="/White Isotype.png" 
                alt="GroCode" 
                className="w-full h-full object-contain hidden dark:block group-hover:scale-110 transition-transform" 
              />
            </div>
            <span className="font-black text-xl tracking-tight">GroCode</span>
          </Link>

          {session && (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/feed" className="text-sm font-semibold px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-muted/5 transition-all">
                Dashboard
              </Link>
              <Link href="/mentors" className="text-sm font-semibold px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-muted/5 transition-all">
                Mentores
              </Link>
              <Link href="/roadmap" className="text-sm font-semibold px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-muted/5 transition-all">
                Roadmap
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session && (
            <div className="hidden sm:flex items-center bg-muted/5 border border-border-gro rounded-full px-4 py-2 gap-2 w-52 focus-within:border-accent-gro focus-within:w-64 transition-all duration-300">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input 
                type="text" 
                placeholder="Buscar recursos..." 
                className="bg-transparent border-none outline-none text-xs w-full placeholder:text-muted/50"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {session ? (
              <>
                <NotificationPanel />
                <Link 
                  href={`/profile/${session.user.id}`} 
                  className="w-8 h-8 rounded-full bg-muted/20 overflow-hidden border border-border-gro hover:border-accent-gro transition-colors"
                >
                  {dbUser?.image || session.user.image ? (
                    <img src={dbUser?.image || session.user.image || ""} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-2 text-muted" />
                  )}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/signin" className="text-sm font-bold hover:text-accent-gro transition-colors">
                  Ingresar
                </Link>
                <Link href="/auth/register" className="gro-btn gro-btn-primary !py-2 !px-5 !text-sm !rounded-full">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
