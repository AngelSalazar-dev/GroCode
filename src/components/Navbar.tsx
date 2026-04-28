import Link from "next/link"
import { auth } from "@/auth/auth"
import { Search, Plus, Bell, User as UserIcon, LogOut, Menu } from "lucide-react"
import ThemeToggle from "./ThemeToggle"

export default async function Navbar() {
  const session = await auth()

  return (
    <nav className="border-b border-border-github bg-card-github py-3 sticky top-0 z-50 backdrop-blur-md bg-card-github/90">
      <div className="max-w-[1280px] mx-auto px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/" className="hover:opacity-70 transition-opacity flex items-center gap-2">
            <img src="/isotype.png" alt="GroCode Logo" className="w-8 h-8 object-contain dark:brightness-110 brightness-0 transition-all" />
            <span className="font-bold text-lg hidden sm:inline-block tracking-tighter">GroCode</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 text-sm font-semibold">
            <Link href="/feed" className="hover:text-accent-github transition-colors">Dashboard</Link>
            <Link href="/mentors" className="hover:text-accent-github transition-colors">Mentores</Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <button className="p-1.5 hover:bg-muted/10 rounded-md hidden sm:block transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <Link href={`/profile/${session.user.id}`} className="flex items-center gap-1 group">
                <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden border border-border-github group-hover:border-accent-github transition-colors">
                  {session.user.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-1 text-slate-400" />
                  )}
                </div>
              </Link>
              <form action="/api/auth/signout" method="POST" className="flex items-center">
                <button type="submit" className="p-1.5 hover:text-rose-500 rounded-md transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className="gh-button transition-all hover:bg-muted/5">
                Sign in
              </Link>
              <Link href="/auth/signin" className="gh-button gh-button-primary transition-all hover:scale-105 active:scale-95">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
