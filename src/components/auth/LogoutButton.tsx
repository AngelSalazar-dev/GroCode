"use client"

import { LogOut } from "lucide-react"
import { logoutAction } from "@/actions/auth"

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button 
        type="submit"
        className="p-2 hover:text-rose-500 transition-colors"
        title="Cerrar Sesión"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </form>
  )
}
