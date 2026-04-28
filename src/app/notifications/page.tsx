"use client"

import { motion } from "framer-motion"
import { Bell, ShieldCheck, Star, MessageSquare, UserPlus, Megaphone, ArrowRight, CheckCheck, Filter } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

const ALL_NOTIFICATIONS = [
  { id: "1", type: "mentorship", read: false, message: "Dan Abramov aceptó tu solicitud de mentoría", time: "Hace 2h", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/feed" },
  { id: "2", type: "like", read: false, message: "Sarah Drasner le dio ⭐ a tu publicación", time: "Hace 4h", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", href: "/feed" },
  { id: "3", type: "comment", read: true, message: "Addy Osmani comentó en tu recurso de React", time: "Ayer", icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/feed" },
  { id: "4", type: "follow", read: false, message: "3 nuevos desarrolladores te están siguiendo", time: "Ayer", icon: UserPlus, color: "text-sky-500", bg: "bg-sky-500/10", href: "/feed" },
  { id: "5", type: "announcement", read: true, message: "🎉 GroCode Beta v1.0 ya está disponible", time: "Hace 2 días", icon: Megaphone, color: "text-foreground", bg: "bg-muted/10", href: "/feed" },
  { id: "6", type: "mentorship", read: true, message: "Tu solicitud de mentoría con Guillermo Rauch fue aceptada", time: "Hace 3 días", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/mentors" },
  { id: "7", type: "like", read: true, message: "Tu publicación sobre TypeScript recibió 15 ⭐", time: "Hace 4 días", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", href: "/feed" },
  { id: "8", type: "follow", read: true, message: "Ricardo Salazar comenzó a seguirte", time: "Hace 5 días", icon: UserPlus, color: "text-sky-500", bg: "bg-sky-500/10", href: "/feed" },
  { id: "9", type: "comment", read: true, message: "Nuevo comentario en tu recurso de Docker", time: "Hace 1 semana", icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/feed" },
  { id: "10", type: "announcement", read: true, message: "📢 Nuevos canales de lenguajes disponibles en el Dashboard", time: "Hace 1 semana", icon: Megaphone, color: "text-foreground", bg: "bg-muted/10", href: "/feed" },
]

const FILTER_TABS = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "mentorship", label: "Mentorías" },
  { id: "like", label: "Estrellas" },
  { id: "follow", label: "Seguidores" },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(ALL_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState("all")

  const filtered = notifications.filter(n => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    return n.type === activeTab
  })

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7" /> Notificaciones
            {unreadCount > 0 && (
              <span className="text-sm bg-rose-500 text-white px-3 py-1 rounded-full font-black">{unreadCount} nuevas</span>
            )}
          </h1>
          <p className="text-sm text-muted font-medium">Tu actividad reciente en GroCode</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="gro-btn !text-xs !py-2 !px-4 !rounded-full flex items-center gap-2">
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-border-gro pb-0">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id ? "text-accent-gro" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.span layoutId="notif-tab" className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="divide-y divide-border-gro gro-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Bell className="w-12 h-12 text-muted/20 mx-auto" />
            <p className="text-muted font-medium">No hay notificaciones en esta categoría</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const Icon = n.icon
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={n.href}
                  onClick={() => setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))}
                  className={`flex items-start gap-4 p-5 hover:bg-muted/5 transition-colors group ${!n.read ? "bg-accent-gro/[0.03]" : ""}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${n.bg}`}>
                    <Icon className={`w-5 h-5 ${n.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? "font-bold text-foreground" : "font-medium text-muted"}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted/60 mt-1">{n.time}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    {!n.read && <span className="w-2.5 h-2.5 bg-accent-gro rounded-full" />}
                    <ArrowRight className="w-4 h-4 text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
