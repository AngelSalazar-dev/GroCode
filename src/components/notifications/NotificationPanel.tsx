"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  X,
  ShieldCheck,
  MessageSquare,
  Star,
  CheckCheck,
  UserPlus,
  Megaphone,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/actions/notifications"
import type { NotificationType } from "@/lib/notifications"

export interface NotificationItem {
  id: string
  type: NotificationType | string
  content: string
  link: string | null
  read: boolean
  createdAt: string | Date
  fromUser: { id: string; name: string | null; image: string | null } | null
}

const ICON_MAP: Record<string, typeof Bell> = {
  mentorship: ShieldCheck,
  like: Star,
  comment: MessageSquare,
  follow: UserPlus,
  announcement: Megaphone,
}

const COLOR_MAP: Record<string, { color: string; bg: string }> = {
  mentorship: { color: "text-emerald-700 dark:text-emerald-500", bg: "bg-emerald-500/10" },
  like: { color: "text-amber-700 dark:text-amber-500", bg: "bg-amber-500/10" },
  comment: { color: "text-indigo-500", bg: "bg-indigo-500/10" },
  follow: { color: "text-sky-700 dark:text-sky-500", bg: "bg-sky-500/10" },
  announcement: { color: "text-accent-gro", bg: "bg-accent-gro/10" },
}

export function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // The badge must be accurate before the panel is ever opened, so the count
  // is fetched on mount and refreshed by a light poll.
  const loadCount = useCallback(async () => {
    const { count } = await getUnreadCount()
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    // The await keeps setState out of the synchronous effect body, so the
    // first paint is not a cascading render.
    void (async () => {
      await Promise.resolve()
      await loadCount()
    })()

    const id = setInterval(() => void loadCount(), 60_000)
    return () => clearInterval(id)
  }, [loadCount])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    void (async () => {
      setLoading(true)
      const [{ notifications: notifs }, { count }] = await Promise.all([
        getNotifications(10),
        getUnreadCount(),
      ])
      if (cancelled) return
      setNotifications(notifs as NotificationItem[])
      setUnreadCount(count)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  // Close on Escape or on an outside click.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onClickOutside)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onClickOutside)
    }
  }, [open])

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead()
    if ("error" in result) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      const result = await markAsRead(n.id)
      if (!("error" in result)) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === n.id ? { ...notif, read: true } : notif))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        className="relative p-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 rounded-full border-2 border-background flex items-center justify-center">
            <span className="text-[8px] text-white font-black">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notificaciones"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="absolute right-0 top-11 w-[340px] max-w-[calc(100vw-2rem)] gro-card shadow-2xl z-50 overflow-hidden"
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
                    className="p-1.5 min-h-11 min-w-11 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
                    title="Marcar todo como leído"
                    aria-label="Marcar todo como leído"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar notificaciones"
                  className="p-1.5 min-h-11 min-w-11 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors text-muted hover:text-foreground"
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
                  <Bell className="w-10 h-10 text-muted/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted">Sin notificaciones</p>
                  <p className="text-xs text-muted mt-1">
                    Las notificaciones aparecerán aquí
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type] ?? Bell
                  const colors = COLOR_MAP[n.type] ?? {
                    color: "text-muted",
                    bg: "bg-muted/10",
                  }
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-muted/5 transition-colors group cursor-pointer ${
                        !n.read ? "bg-accent-gro/[0.03]" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${colors.bg}`}
                      >
                        <Icon className={`w-4 h-4 ${colors.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-relaxed ${
                            !n.read
                              ? "font-bold text-foreground"
                              : "font-medium text-muted"
                          }`}
                        >
                          {n.content}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {getTimeAgo(new Date(n.createdAt))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mt-1">
                        {!n.read && (
                          <span className="w-2 h-2 bg-accent-gro rounded-full" />
                        )}
                        <ArrowRight className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="p-3 border-t border-border-gro">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push("/notifications")
                }}
                className="w-full text-center text-xs font-bold text-accent-gro hover:underline py-1 flex items-center justify-center gap-1"
              >
                Ver todas las notificaciones <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
