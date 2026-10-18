"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, ShieldCheck, MessageSquare, Star, CheckCheck, UserPlus, Megaphone, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications"
import { timeAgo } from "@/lib/timeAgo"

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; href: string }> = {
  mentorship: { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/feed" },
  like: { icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", href: "/feed" },
  comment: { icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/feed" },
  follow: { icon: UserPlus, color: "text-sky-500", bg: "bg-sky-500/10", href: "/feed" },
  announcement: { icon: Megaphone, color: "text-accent-gro", bg: "bg-accent-gro/10", href: "/feed" },
  collaboration: { icon: UserPlus, color: "text-violet-500", bg: "bg-violet-500/10", href: "/feed" },
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await markAsRead(n.id)
      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
    }
    setOpen(false)
    router.push(n.link || "/feed")
  }

  const getConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.announcement

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
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted font-medium">No tienes notificaciones</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const config = getConfig(n.type)
                    const Icon = config.icon
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/5 transition-colors group cursor-pointer ${!n.read ? "bg-accent-gro/[0.03]" : ""}`}
                      >
                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${config.bg}`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!n.read ? "font-bold text-foreground" : "font-medium text-muted"}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
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
