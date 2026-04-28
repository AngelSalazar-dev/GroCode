"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, ShieldCheck, MessageSquare, Star, CheckCheck, UserPlus, Megaphone, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  type: string
  read: boolean
  message: string
  time: string
  icon: any
  color: string
  bg: string
  href: string
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "mentorship",
    read: false,
    message: "Dan Abramov aceptó tu solicitud de mentoría",
    time: "Hace 2h",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    href: "/feed",
  },
  {
    id: "2",
    type: "like",
    read: false,
    message: "Sarah Drasner le dio ⭐ a tu publicación",
    time: "Hace 4h",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    href: "/feed",
  },
  {
    id: "3",
    type: "comment",
    read: true,
    message: "Addy Osmani comentó en tu recurso de React",
    time: "Ayer",
    icon: MessageSquare,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    href: "/feed",
  },
  {
    id: "4",
    type: "follow",
    read: false,
    message: "3 nuevos desarrolladores te están siguiendo",
    time: "Ayer",
    icon: UserPlus,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    href: "/feed",
  },
  {
    id: "5",
    type: "announcement",
    read: true,
    message: "🎉 GroCode Beta v1.0 ya está disponible",
    time: "Hace 2 días",
    icon: Megaphone,
    color: "text-accent-gro",
    bg: "bg-accent-gro/10",
    href: "/feed",
  },
]

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotificationClick = (n: Notification) => {
    setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
    setOpen(false)
    router.push(n.href)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-muted/10 rounded-full transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-background flex items-center justify-center">
            <span className="text-[8px] text-white font-black">{unreadCount}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="absolute right-0 top-11 w-[340px] gro-card shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border-gro">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="p-1.5 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
                      title="Marcar todo como leído"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-border-gro max-h-[360px] overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/5 transition-colors group cursor-pointer ${!n.read ? "bg-accent-gro/[0.03]" : ""}`}
                    >
                      <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${n.bg}`}>
                        <Icon className={`w-4 h-4 ${n.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${!n.read ? "font-bold text-foreground" : "font-medium text-muted"}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted/60 mt-1">{n.time}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mt-1">
                        {!n.read && <span className="w-2 h-2 bg-accent-gro rounded-full" />}
                        <ArrowRight className="w-3 h-3 text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="p-3 border-t border-border-gro">
                <button
                  onClick={() => { setOpen(false); router.push("/notifications") }}
                  className="w-full text-center text-xs font-bold text-accent-gro hover:underline py-1 flex items-center justify-center gap-1"
                >
                  Ver todas las notificaciones <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
