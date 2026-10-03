"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, ShieldCheck, MessageSquare, Star, CheckCheck, UserPlus, Megaphone, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/actions/notifications"

const ICON_MAP: Record<string, any> = {
  mentorship: ShieldCheck,
  like: Star,
  comment: MessageSquare,
  follow: UserPlus,
  announcement: Megaphone,
}

const COLOR_MAP: Record<string, { color: string; bg: string }> = {
  mentorship: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  like: { color: "text-amber-500", bg: "bg-amber-500/10" },
  comment: { color: "text-indigo-500", bg: "bg-indigo-500/10" },
  follow: { color: "text-sky-500", bg: "bg-sky-500/10" },
  announcement: { color: "text-accent-gro", bg: "bg-accent-gro/10" },
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes}m`
  if (hours < 24) return `Hace ${hours}h`
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days}d`
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
  }, [open])

  const loadNotifications = async () => {
    if (!open) return
    setLoading(true)
    const [notifs, count] = await Promise.all([
      getNotifications(10),
      getUnreadCount(),
    ])
    setNotifications(notifs.notifications || [])
    setUnreadCount(count.count || 0)
    setLoading(false)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await markAsRead(n.id)
      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
    if (n.link) router.push(n.link)
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
                      onClick={handleMarkAllRead}
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
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted mx-auto" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted">Sin notificaciones</p>
                    <p className="text-xs text-muted/60 mt-1">Las notificaciones aparecerán aquí</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = ICON_MAP[n.type] || Bell
                    const colors = COLOR_MAP[n.type] || { color: "text-muted", bg: "bg-muted/10" }
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/5 transition-colors group cursor-pointer ${!n.read ? "bg-accent-gro/[0.03]" : ""}`}
                      >
                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!n.read ? "font-bold text-foreground" : "font-medium text-muted"}`}>
                            {n.content}
                          </p>
                          <p className="text-[10px] text-muted/60 mt-1">{getTimeAgo(new Date(n.createdAt))}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mt-1">
                          {!n.read && <span className="w-2 h-2 bg-accent-gro rounded-full" />}
                          <ArrowRight className="w-3 h-3 text-muted/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    )
                  })
                )}
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