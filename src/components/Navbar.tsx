import NavbarClient from "./NavbarClient"

export default function Navbar() {
  return (
    <nav className="border-b border-border-gro bg-background/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <NavbarClient />
      </div>
    </nav>
  )
}