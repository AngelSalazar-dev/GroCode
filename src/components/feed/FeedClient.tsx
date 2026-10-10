"use client"

// 
/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- . */
import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import PostCard, { type PostCardData } from "@/components/feed/PostCard"
import Link from "next/link"
import { Plus, Hash, ChevronDown, ChevronRight, Menu, X } from "lucide-react"
import { CHANNELS, getChannel } from "@/lib/channels"
import { useModalBehaviour } from "@/hooks/useModalBehaviour"

interface FeedClientProps {
  posts: PostCardData[]
  currentUserId?: string
  totalPosts: number
  currentPage: number
  take: number
  activeChannel?: string
}

interface ChannelListProps {
  activeChannel: string
  onSelect: (id: string) => void
}

// Declared at module scope: a component created during render would remount
// (and lose state) on every parent render.
function ChannelList({ activeChannel, onSelect }: ChannelListProps) {
  return (
    <div className="space-y-0.5">
      {CHANNELS.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          aria-current={activeChannel === c.id ? "page" : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeChannel === c.id
              ? "bg-accent-gro/10 text-accent-gro font-bold"
              : "text-muted hover:bg-muted/5 hover:text-foreground"
          }`}
        >
          <Hash
            className={`w-3.5 h-3.5 shrink-0 ${
              activeChannel === c.id ? "text-accent-gro" : "text-muted"
            }`}
          />
          <span className="text-[13px] truncate">{c.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function FeedClient({
  posts,
  currentUserId,
  totalPosts,
  currentPage,
  take,
  activeChannel = "general",
}: FeedClientProps) {
  const [channelsOpen, setChannelsOpen] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // El drawer movil es un dialogo real: Escape, foco atrapado y devuelto.
  const drawerRef = useRef<HTMLElement | null>(null)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])
  useModalBehaviour(mobileNavOpen, closeMobileNav, drawerRef)
  const router = useRouter()

  const channel = getChannel(activeChannel)
  const totalPages = Math.max(1, Math.ceil(totalPosts / take))
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const goToPage = (page: number) => {
    router.push(`/feed?channel=${activeChannel}&page=${page}`)
    document.getElementById("feed-scroll")?.scrollTo({ top: 0 })
  }

  const selectChannel = (id: string) => router.push(`/feed?channel=${id}&page=1`)

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Discord-style Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border-gro bg-muted/[0.02] overflow-y-auto">
        <div className="p-4 border-b border-border-gro">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted px-2">
            Community
          </h2>
        </div>

        <div className="p-3 flex-1">
          <button
            onClick={() => setChannelsOpen(!channelsOpen)}
            aria-expanded={channelsOpen}
            className="w-full flex items-center justify-between px-2 py-1.5 mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors"
          >
            Canales
            {channelsOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          <AnimatePresence>
            {channelsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ChannelList activeChannel={activeChannel} onSelect={selectChannel} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Mobile channel drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <div
              className="fixed inset-0 z-40 lg:hidden"
              onClick={closeMobileNav}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border-gro p-4 overflow-y-auto lg:hidden"
              ref={drawerRef}
              id="feed-channel-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Canales"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted">
                  Canales
                </h2>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-1.5 min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-muted/10 text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ChannelList
                activeChannel={activeChannel}
                onSelect={(id) => {
                  setMobileNavOpen(false)
                  selectChannel(id)
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Channel Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border-gro flex items-center justify-between gap-3 shrink-0 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú de canales"
              aria-expanded={mobileNavOpen}
              aria-controls="feed-channel-drawer"
              className="lg:hidden p-2 min-h-11 min-w-11 flex items-center justify-center -ml-2 rounded-full hover:bg-muted/10 text-muted shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="w-5 h-5 text-muted shrink-0" />
              <h1 className="font-black text-lg tracking-tight truncate">{channel.label}</h1>
            </div>
            <span className="hidden sm:block text-xs text-muted font-medium border-l border-border-gro pl-3 truncate">
              Recursos y publicaciones de la comunidad GroCode
            </span>
          </div>
          <Link
            href="/feed/new"
            className="gro-btn gro-btn-primary !py-2 !px-5 !rounded-full !text-xs min-h-11 min-w-11 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {/* `hidden sm:inline` dejaba el enlace sin nombre accesible en movil:
                el texto se va del arbol de accesibilidad igual que de la pantalla.
                `sr-only sm:not-sr-only` lo oculta solo visualmente. */}
            <span className="sr-only sm:not-sr-only">Publicar</span>
          </Link>
        </div>

        {/* Posts Feed — the scroll container also holds the pagination */}
        <div id="feed-scroll" className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChannel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                  ))
                ) : (
                  <div className="py-32 text-center space-y-4">
                    <p className="text-5xl">{channel.icon}</p>
                    <p className="font-bold text-xl">Sé el primero en publicar aquí</p>
                    <p className="text-muted text-sm">
                      No hay contenido en #{channel.label} todavía.
                    </p>
                    <Link
                      href="/feed/new"
                      className="inline-block gro-btn gro-btn-primary !rounded-full !px-8 !py-3 mt-4"
                    >
                      Crear publicación
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {totalPages > 1 && (
              <nav
                aria-label="Paginación del feed"
                className="flex items-center justify-center gap-4 pt-4 pb-8"
              >
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrev}
                  className="gro-btn disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-muted text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNext}
                  className="gro-btn disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Right Info Panel */}
      <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-border-gro bg-muted/[0.02] overflow-y-auto">
        <div className="p-5 border-b border-border-gro">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Anuncios
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="p-4 rounded-xl bg-accent-gro/5 border border-accent-gro/10 space-y-2">
            <p className="text-sm font-bold">🎓 Encuentra un mentor</p>
            <p className="text-xs text-muted leading-relaxed">
              {CHANNELS.length} canales de recursos, {[1, 2, 3].map((i) => `#${CHANNELS[i].label}`).join(", ")} y más.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border-gro space-y-2">
            <p className="text-sm font-bold">🏆 Mentores verificados</p>
            <p className="text-xs text-muted leading-relaxed">
              Seniors cuya postulación fue revisada por el equipo de GroCode.
            </p>
            <Link
              href="/mentors"
              className="text-xs font-bold text-accent-gro hover:underline"
            >
              Ver directorio →
            </Link>
          </div>
          <div className="p-4 rounded-xl border border-border-gro space-y-2">
            <p className="text-sm font-bold">📢 Canales activos</p>
            <div className="space-y-1.5 mt-2">
              {CHANNELS.slice(0, 5).map((ch) => (
                <Link
                  key={ch.id}
                  href={`/feed?channel=${ch.id}&page=1`}
                  className="w-full flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
                >
                  <Hash className="w-3 h-3 shrink-0" />
                  <span>{ch.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-border-gro">
          <p className="text-[10px] font-medium text-muted mt-2">
            GroCode Platform © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </div>
  )
}
