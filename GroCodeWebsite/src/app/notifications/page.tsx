"use client"

import { motion } from "framer-motion"
import { Bell, ShieldCheck, Star, MessageSquare, UserPlus, Megaphone, ArrowRight, CheckCheck, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications"
import { timeAgo } from "@/lib/timeAgo"

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; href: string }> = {
  mentorship: { icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/feed" },
  like: { icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", href: "/feed" },
  comment: { icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/feed" },
  follow: { icon: UserPlus, color: "text-sky-500", bg: "bg-sky-500/10", href: "/feed" },
  announcement: { icon: Megaphone, color: "text-foreground", bg: "bg-muted/10", href: "/feed" },
  collaboration: { icon: UserPlus, color: "text-violet-500", bg: "bg-violet-500/10", href: "/feed" },
}

const FILTER_TABS = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "mentorship", label: "Mentorías" },
  { id: "like", label: "Estrellas" },
  { id: "follow", label: "Seguidores" },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

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

  const filtered = notifications.filter(n => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    return n.type === activeTab
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const getConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.announcement

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
          <button onClick={handleMarkAllRead} className="gro-btn !text-xs !py-2 !px-4 !rounded-full flex items-center gap-2">
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
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Bell className="w-12 h-12 text-muted/20 mx-auto" />
            <p className="text-muted font-medium">No hay notificaciones en esta categoría</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const config = getConfig(n.type)
            const Icon = config.icon
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={n.link || config.href}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`flex items-start gap-4 p-5 hover:bg-muted/5 transition-colors group ${!n.read ? "bg-accent-gro/[0.03]" : ""}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? "font-bold text-foreground" : "font-medium text-muted"}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
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
