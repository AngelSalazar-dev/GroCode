"use client"

import { User, Role } from "@/generated-v4/client"
import { updateUserRole } from "@/actions/admin"
import { useState, useTransition, useMemo } from "react"
import { ShieldCheck, User as UserIcon, Search, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdminClientProps {
  users: User[]
  currentUserId?: string
  founderEmail: string
}

export default function AdminClient({ 
  users, 
  currentUserId, 
  founderEmail 
}: AdminClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  const onRoleChange = (userId: string, newRole: Role) => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent-gro/10 text-accent-gro rounded-2xl flex items-center justify-center border border-accent-gro/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Panel Administrativo</h1>
            <p className="text-muted text-sm font-medium">Gestión de usuarios y privilegios</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/10 px-4 py-2 rounded-xl border border-border-gro">
          <Users className="w-4 h-4 text-accent-gro" />
          <span className="text-sm font-bold">{users.length} Usuarios totales</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent-gro transition-colors" />
          <input 
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/5 border border-border-gro rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-accent-gro transition-all font-medium"
          />
        </div>

        <div className="gro-card overflow-hidden">
          <div className="divide-y divide-border-gro">
            {filteredUsers.map(user => {
              const isFounder = user.email === founderEmail
              return (
                <div key={user.id} className="p-5 flex items-center justify-between hover:bg-muted/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center overflow-hidden border border-border-gro">
                      {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-muted" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{user.name}</p>
                        {isFounder && <span className="bg-accent-gro text-background text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Founder</span>}
                        {user.id === currentUserId && <span className="text-[10px] text-muted font-bold">(Tú)</span>}
                      </div>
                      <p className="text-xs text-muted font-medium">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select 
                      disabled={isPending || isFounder}
                      value={user.role}
                      onChange={(e) => onRoleChange(user.id, e.target.value as Role)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none bg-background transition-all ${
                        user.role === 'ADMIN' ? 'border-rose-500/30 text-rose-500' :
                        user.role === 'SENIOR' ? 'border-amber-500/30 text-amber-500' :
                        'border-border-gro text-muted'
                      } ${isFounder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-gro'}`}
                    >
                      <option value="JUNIOR">JUNIOR</option>
                      <option value="SENIOR">SENIOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>

                    {isPending && <Loader2 className="w-4 h-4 animate-spin text-accent-gro" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
