"use client"

//
/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- . */
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Star, MapPin, Search, Filter, ChevronDown, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { MentorCard } from "@/lib/select"
import {
  FILTER_OPTIONS,
  SORT_OPTIONS,
  directoryUrl,
  type DirectoryQuery,
  type FilterId,
} from "@/lib/mentor-filters"
import UserAvatar from "@/components/UserAvatar"

/** How long typing has to stop before the query is sent to the server. */
const SEARCH_DEBOUNCE = 300

interface MentorsListProps {
  mentors: MentorCard[]
  counts: Record<FilterId, number>
  /** Matches across the whole directory, not the mentors on this page. */
  total: number
  page: number
  totalPages: number
  query: DirectoryQuery
}

/**
 * Renders one page of the directory and turns every control into a URL.
 *
 * Filtering, sorting and searching happen on the server and live in
 * `searchParams`, so a filtered directory is shareable, survives a reload and
 * never ships the whole senior list to the browser. This component only holds
 * the state that has to be instant — the text being typed — and mirrors the
 * committed query so the controls light up before the round trip lands.
 */
export default function MentorsList({
  mentors,
  counts,
  total,
  page,
  totalPages,
  query,
}: MentorsListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // The committed query is whatever the URL says. There is no local copy: the
  // highlight and the results always come from the same place, so they can
  // never disagree.
  const [searchText, setSearchText] = useState(query.q)
  const [settledQ, setSettledQ] = useState(query.q)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelSearch = useCallback(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
      searchTimer.current = null
    }
  }, [])

  const applyQuery = useCallback(
    (patch: Partial<DirectoryQuery>, targetPage = 1) => {
      // Whatever navigation happens next already carries the text in the box,
      // so a search still on its way would only race it.
      cancelSearch()
      // Every control commits the search box too, otherwise clicking a
      // specialty would silently drop a query the user had just typed.
      const next: DirectoryQuery = { ...query, q: searchText, ...patch }
      startTransition(() => {
        router.replace(directoryUrl(next, targetPage), { scroll: false })
      })
    },
    [query, searchText, router, cancelSearch],
  )

  // Typing does not navigate per keystroke: one request per pause.
  useEffect(() => {
    if (searchText === query.q) return
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null
      applyQuery({ q: searchText })
    }, SEARCH_DEBOUNCE)
    return cancelSearch
  }, [searchText, query.q, applyQuery, cancelSearch])

  // React's "adjust state when a prop changes", done during render because a
  // `setState` inside an effect is what makes render → effect → setState loops.
  // The guard is the point: only lift the server's `q` into the box when the
  // box still holds the previous server's `q`. Uncommitted keystrokes survive a
  // late response or a Back press, and a Back with nothing pending still lands.
  if (settledQ !== query.q) {
    const edited = searchText !== settledQ
    setSettledQ(query.q)
    if (!edited) setSearchText(query.q)
  }

  // El desplegable de orden se cierra con Escape y devuelve el foco al boton.
  const [showSort, setShowSort] = useState(false)
  const sortButtonRef = useRef<HTMLButtonElement | null>(null)
  const closeSort = useCallback(() => {
    setShowSort(false)
    sortButtonRef.current?.focus()
  }, [])
  useEffect(() => {
    if (!showSort) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeSort() }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [showSort, closeSort])

  const activeFilter = FILTER_OPTIONS.find((option) => option.id === query.cat)

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-6 flex flex-col md:flex-row gap-10">
      {/* Sidebar Filters */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-72 space-y-8 shrink-0"
      >
        {/* Search */}
        <div className="flex items-center gap-2 bg-muted/5 border border-border-gro rounded-xl px-4 py-2.5 focus-within:border-accent-gro transition-all">
          <Search className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
          <label htmlFor="mentor-search" className="sr-only">Buscar mentores</label>
          <input
            id="mentor-search"
            type="search"
            placeholder="Buscar mentores..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted"
          />
        </div>

        {/* Category Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted px-1">
            <Filter className="w-4 h-4" aria-hidden="true" />
            <h2 className="text-xs font-black uppercase tracking-widest">Especialidad</h2>
          </div>
          <div className="space-y-1">
            {FILTER_OPTIONS.map((filter, i) => (
              <motion.button
                key={filter.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => applyQuery({ cat: filter.id }, 1)}
                aria-pressed={query.cat === filter.id}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border border-transparent ${
                  query.cat === filter.id
                    ? "bg-accent-gro/5 text-accent-gro border-accent-gro/10"
                    : "hover:bg-muted/5 text-muted hover:text-foreground"
                }`}
              >
                <span>{filter.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  query.cat === filter.id
                    ? "bg-accent-gro text-background font-black"
                    : "text-muted"
                }`}>
                  {counts[filter.id] ?? 0}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Apply as Senior CTA */}
        <Link href="/apply-senior" className="block gro-card p-6 space-y-4 hover:border-amber-500 transition-all group">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold">¿Eres experto?</h3>
          <p className="text-xs text-muted leading-relaxed font-medium">Ayuda a otros a crecer y obtén la insignia de Senior Verificado.</p>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-500 group-hover:underline">Postularme →</span>
        </Link>
      </motion.div>

      {/* Results */}
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between border-b border-border-gro pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight" aria-live="polite">
              {total} <span className="text-muted font-medium">
                {total === 1 ? "Mentor" : "Mentores"}{" "}
                {query.cat !== "all"
                  ? `en ${activeFilter?.label}`
                  : total === 1
                    ? "disponible"
                    : "disponibles"}
              </span>
            </h1>
            <p className="text-sm text-muted font-medium">Expertos listos para ayudarte a escalar tus habilidades.</p>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              ref={sortButtonRef}
              onClick={() => setShowSort(!showSort)}
              aria-expanded={showSort}
              aria-haspopup="menu"
              aria-controls="mentor-sort-menu"
              className="gro-btn !py-2 !px-4 !text-xs font-bold flex items-center gap-2"
            >
              {SORT_OPTIONS.find((option) => option.id === query.sort)?.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <AnimatePresence>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeSort} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-2 w-48 gro-card shadow-2xl z-50 overflow-hidden"
                    id="mentor-sort-menu"
                    role="menu"
                    aria-label="Ordenar mentores"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        role="menuitemradio"
                        aria-checked={query.sort === option.id}
                        onClick={() => { applyQuery({ sort: option.id }, 1); closeSort() }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                          query.sort === option.id ? "bg-accent-gro/5 text-accent-gro" : "text-muted hover:bg-muted/5 hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* `aria-busy` while the server answers: the old list stays on screen
            instead of blanking, and assistive tech is told it is stale. */}
        <div aria-busy={isPending} className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid grid-cols-1 gap-5">
            {mentors.map((mentor, i) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="gro-card p-6 group"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link href={`/profile/${mentor.id}`} className="w-16 h-16 rounded-2xl bg-muted/10 overflow-hidden border border-border-gro shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                    <UserAvatar
                          src={mentor.image}
                          name={mentor.name}
                          size={64}
                          rounded="rounded-2xl"
                          className="w-16 h-16 border border-border-gro"
                        />
                  </Link>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${mentor.id}`} className="text-lg font-black inline-flex items-center min-h-11 hover:text-accent-gro transition-colors tracking-tight truncate">
                            {mentor.name}
                          </Link>
                          <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-500 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Senior</span>
                          <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500">Disponible</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/profile/${mentor.id}`} className="gro-btn gro-btn-primary min-h-11 min-w-11 flex items-center justify-center !py-1.5 !px-4 !text-[11px] font-bold !rounded-full">
                          Ver perfil
                        </Link>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/80 leading-relaxed font-medium line-clamp-2">
                      {mentor.bio ?? "Experto en arquitectura Full-stack. Ayudo a Juniors a dominar principios de código limpio y escalabilidad."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted font-bold">
                      {mentor.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[120px]">{mentor.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500 shrink-0" aria-hidden="true" />
                        <span className="text-xs font-bold">Senior</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {total === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center space-y-6 gro-card border-dashed bg-transparent"
            >
              <Search className="w-12 h-12 text-muted/40 mx-auto" aria-hidden="true" />
              <div className="space-y-2">
                <p className="font-bold">No se encontraron mentores</p>
                <p className="text-muted text-sm">Prueba cambiando los filtros o tu búsqueda.</p>
              </div>
              <button
                onClick={() => applyQuery({ q: "", cat: "all" }, 1)}
                className="gro-btn !text-xs !rounded-full min-h-11"
              >
                Limpiar filtros
              </button>
            </motion.div>
          )}
        </div>

        {totalPages > 1 && (
          <nav
            aria-label="Paginación"
            className="flex items-center justify-center gap-4 pt-4"
          >
            {page > 1 ? (
              <Link
                href={directoryUrl(query, page - 1)}
                rel="prev"
                className="gro-btn !rounded-full !px-6 !text-xs min-h-11"
              >
                Anterior
              </Link>
            ) : (
              <span className="gro-btn !rounded-full !px-6 !text-xs min-h-11 opacity-70 cursor-not-allowed">
                Anterior
              </span>
            )}
            <span className="text-sm text-muted">
              Página {page} de {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={directoryUrl(query, page + 1)}
                rel="next"
                className="gro-btn !rounded-full !px-6 !text-xs min-h-11"
              >
                Siguiente
              </Link>
            ) : (
              <span className="gro-btn !rounded-full !px-6 !text-xs min-h-11 opacity-70 cursor-not-allowed">
                Siguiente
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
