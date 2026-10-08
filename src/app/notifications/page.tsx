"use client"

import { motion } from "framer-motion"
import { Bell, ShieldCheck, Star, MessageSquare, UserPlus, Megaphone, ArrowRight, CheckCheck, Loader2, Trash2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notifications"
import {
  getTimeAgo,
  type NotificationItem,
} from "@/components/notifications/NotificationPanel"

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

const FILTER_TABS = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "mentorship", label: "Mentorías" },
  { id: "like", label: "Estrellas" },
  { id: "follow", label: "Seguidores" },
] as const

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  // Defined before the effect that uses it, otherwise the effect closes over a
  // binding that is still in its temporal dead zone.
  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ notifications: notifs }, { count }] = await Promise.all([
      getNotifications(50),
      getUnreadCount(),
    ])
    setNotifications(notifs as NotificationItem[])
    setUnreadCount(count)
    setLoading(false)
  }, [])

  useEffect(() => {
    // The await keeps setState out of the synchronous effect body.
    void (async () => {
      await Promise.resolve()
      await loadData()
    })()
  }, [loadData])

  const filtered = notifications.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    return n.type === activeTab
  })

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
    if (n.link) {
      router.push(n.link)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const result = await deleteNotification(id)
    if ("error" in result) return
    // Hay que leer el estado antes de actualizar. Un setter invocado dentro del
    // updater de otro setter es un efecto secundario durante el render: en
    // StrictMode el updater corre dos veces y el contador bajaba de dos en dos.
    const wasUnread = notifications.find((n) => n.id === id)?.read === false
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7" /> Notificaciones
            {unreadCount > 0 && (
              <span className="text-sm bg-rose-500 text-white px-3 py-1 rounded-full font-black">
                {unreadCount} nuevas
              </span>
            )}
          </h1>
          <p className="text-sm text-muted font-medium">
            Tu actividad reciente en GroCode
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="gro-btn !text-xs !py-2 !px-4 !rounded-full flex items-center gap-2"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border-gro pb-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id
                ? "text-accent-gro"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.span
                layoutId="notif-tab"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-accent-gro rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border-gro gro-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto" />
            <p className="text-sm text-muted mt-4">Cargando notificaciones...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Bell className="w-12 h-12 text-muted/40 mx-auto" />
            <p className="text-muted font-medium">
              No hay notificaciones en esta categoría
            </p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const Icon = ICON_MAP[n.type] ?? Bell
            const colors = COLOR_MAP[n.type] ?? {
              color: "text-muted",
              bg: "bg-muted/10",
            }
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group relative flex items-start gap-4 p-5 hover:bg-muted/5 transition-colors ${
                  !n.read ? "bg-accent-gro/[0.03]" : ""
                }`}
              >
                <button
                  onClick={() => handleNotificationClick(n)}
                  className="flex items-start gap-4 flex-1 min-w-0 text-left"
                >
                  <div
                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${colors.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${colors.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${
                        !n.read ? "font-bold text-foreground" : "font-medium text-muted"
                      }`}
                    >
                      {n.content}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {getTimeAgo(new Date(n.createdAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    {!n.read && (
                      <span className="w-2.5 h-2.5 bg-accent-gro rounded-full" />
                    )}
                    <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  aria-label="Eliminar notificación"
                  title="Eliminar"
                  className="p-1.5 min-h-11 min-w-11 flex items-center justify-center text-muted hover:text-hover:-700 dark:hover:text-hover:-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
