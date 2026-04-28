"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import PostCard from "@/components/feed/PostCard"
import Link from "next/link"
import { Plus, Flame, Star, Clock, Hash, ChevronDown, ChevronRight } from "lucide-react"

const CHANNELS = [
  { id: "general", label: "general", icon: "🌐" },
  { id: "javascript", label: "javascript", icon: "⚡" },
  { id: "typescript", label: "typescript", icon: "🔷" },
  { id: "python", label: "python", icon: "🐍" },
  { id: "react", label: "react", icon: "⚛️" },
  { id: "nextjs", label: "next-js", icon: "▲" },
  { id: "backend", label: "backend", icon: "🛠️" },
  { id: "devops", label: "devops", icon: "🚀" },
  { id: "ai-ml", label: "ia-y-ml", icon: "🤖" },
  { id: "career", label: "carrera", icon: "🎯" },
  { id: "showoff", label: "muestra-tu-trabajo", icon: "🏆" },
]

const CATEGORIES = [
  { id: "trending", label: "Tendencias", icon: Flame },
  { id: "mentors", label: "Top Mentores", icon: Star },
  { id: "recent", label: "Recientes", icon: Clock },
]

interface FeedClientProps {
  posts: any[]
  currentUserId?: string
}

export default function FeedClient({ posts, currentUserId }: FeedClientProps) {
  const [activeChannel, setActiveChannel] = useState("general")
  const [activeCategory, setActiveCategory] = useState("trending")
  const [channelsOpen, setChannelsOpen] = useState(true)
  const router = useRouter()

  const filteredPosts = posts // In the future, filter by channel tag

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Discord-style Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border-gro bg-muted/[0.02] overflow-y-auto">
        <div className="p-4 border-b border-border-gro">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted px-2">Community</h2>
        </div>

        {/* Category Nav */}
        <div className="p-3 border-b border-border-gro space-y-0.5">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === id
                  ? "bg-accent-gro/10 text-accent-gro"
                  : "text-muted hover:bg-muted/5 hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Channels */}
        <div className="p-3 flex-1">
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors"
          >
            Canales
            {channelsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {channelsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-0.5 overflow-hidden"
              >
                {CHANNELS.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveChannel(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      activeChannel === id
                        ? "bg-accent-gro/10 text-accent-gro font-bold"
                        : "text-muted hover:bg-muted/5 hover:text-foreground"
                    }`}
                  >
                    <Hash className={`w-3.5 h-3.5 shrink-0 ${activeChannel === id ? "text-accent-gro" : "text-muted/50"}`} />
                    <span className="text-[13px]">{label}</span>
                    {activeChannel === id && (
                      <span className="ml-auto text-[10px] bg-accent-gro text-background px-1.5 py-0.5 rounded-full font-black">
                        {posts.length}
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Apply as Senior CTA */}
        <div className="p-3 border-t border-border-gro">
          <Link
            href="/apply-senior"
            className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all group"
          >
            <span className="text-xs font-black text-amber-500 uppercase tracking-wider">¿Eres Senior?</span>
            <span className="text-[11px] text-muted font-medium leading-tight">Solicita tu verificación y accede a funciones exclusivas.</span>
            <span className="text-[11px] font-bold text-amber-500 group-hover:underline">Postularme →</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Channel Header */}
        <div className="px-6 py-4 border-b border-border-gro flex items-center justify-between shrink-0 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-muted" />
              <h1 className="font-black text-lg tracking-tight">
                {CHANNELS.find(c => c.id === activeChannel)?.label ?? "general"}
              </h1>
            </div>
            <span className="hidden sm:block text-xs text-muted font-medium border-l border-border-gro pl-3">
              Recursos y publicaciones de la comunidad GroCode
            </span>
          </div>
          <Link
            href="/feed/new"
            className="gro-btn gro-btn-primary !py-2 !px-5 !rounded-full !text-xs flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Publicar
          </Link>
        </div>

        {/* Posts Feed */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChannel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
                ) : (
                  <div className="py-32 text-center space-y-4">
                    <p className="text-5xl">{CHANNELS.find(c => c.id === activeChannel)?.icon}</p>
                    <p className="font-bold text-xl">Sé el primero en publicar aquí</p>
                    <p className="text-muted text-sm">No hay contenido en #{CHANNELS.find(c => c.id === activeChannel)?.label} todavía.</p>
                    <Link href="/feed/new" className="inline-block gro-btn gro-btn-primary !rounded-full !px-8 !py-3 mt-4">
                      Crear publicación
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Info Panel */}
      <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-border-gro bg-muted/[0.02] overflow-y-auto">
        <div className="p-5 border-b border-border-gro">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Anuncios</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="p-4 rounded-xl bg-accent-gro/5 border border-accent-gro/10 space-y-2">
            <p className="text-sm font-bold">🎉 GroCode Beta v1.0</p>
            <p className="text-xs text-muted leading-relaxed">Ya puedes subir videos directamente en tus recursos compartidos.</p>
          </div>
          <div className="p-4 rounded-xl border border-border-gro space-y-2">
            <p className="text-sm font-bold">🏆 Spotlight del mes</p>
            <p className="text-xs text-muted leading-relaxed">Conoce a los 5 mentores que más han ayudado este mes.</p>
            <Link href="/mentors" className="text-xs font-bold text-accent-gro hover:underline">Ver ranking →</Link>
          </div>
          <div className="p-4 rounded-xl border border-border-gro space-y-2">
            <p className="text-sm font-bold">📢 Canales activos</p>
            <div className="space-y-1.5 mt-2">
              {CHANNELS.slice(0, 5).map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className="w-full flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors text-left"
                >
                  <Hash className="w-3 h-3 shrink-0" />
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-border-gro">
          <div className="flex flex-wrap gap-3 text-[10px] font-bold text-muted/50 uppercase tracking-tighter">
            <span className="hover:text-accent-gro cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-accent-gro cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-accent-gro cursor-pointer transition-colors">API</span>
          </div>
          <p className="text-[10px] font-medium text-muted/30 mt-2">GroCode Platform © 2026</p>
        </div>
      </aside>
    </div>
  )
}
