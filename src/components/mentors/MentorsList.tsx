"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Star, MapPin, Code2, Search, Filter, ChevronDown, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const FILTER_OPTIONS = [
  { id: "all", label: "Todos", count: 0 },
  { id: "frontend", label: "Front-end", keywords: ["react","vue","angular","svelte","next","css","tailwind","frontend","front"] },
  { id: "backend", label: "Back-end", keywords: ["node","django","spring","express","rails","laravel","go","rust","backend","postgresql","api"] },
  { id: "devops", label: "DevOps", keywords: ["docker","kubernetes","aws","gcp","azure","ci/cd","pipeline","devops","cloud"] },
  { id: "mobile", label: "Mobile", keywords: ["react native","flutter","swift","ios","android","dart","mobile"] },
  { id: "data", label: "Data / AI", keywords: ["python","tensorflow","ml","ai","data","pandas","scikit","machine learning","spark","etl"] },
]

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevancia" },
  { id: "name-asc", label: "Nombre (A-Z)" },
  { id: "name-desc", label: "Nombre (Z-A)" },
  { id: "newest", label: "Más recientes" },
  { id: "oldest", label: "Más antiguos" },
]

export default function MentorsPage({ mentors }: { mentors: any[] }) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [showSort, setShowSort] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMentors = useMemo(() => {
    let result = [...mentors]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(m => 
        m.name?.toLowerCase().includes(q) ||
        m.bio?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (activeFilter !== "all") {
      const filterConfig = FILTER_OPTIONS.find(f => f.id === activeFilter)
      if (filterConfig && "keywords" in filterConfig) {
        result = result.filter(m => {
          const searchText = `${m.bio ?? ""} ${m.name ?? ""}`.toLowerCase()
          return (filterConfig as any).keywords.some((kw: string) => searchText.includes(kw))
        })
      }
    }

    // Sort
    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
        break
      case "name-desc":
        result.sort((a, b) => (b.name ?? "").localeCompare(a.name ?? ""))
        break
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
    }

    return result
  }, [mentors, activeFilter, sortBy, searchQuery])

  // Compute counts per filter
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mentors.length }
    for (const filter of FILTER_OPTIONS) {
      if (filter.id === "all") continue
      if ("keywords" in filter) {
        counts[filter.id] = mentors.filter(m => {
          const text = `${m.bio ?? ""} ${m.name ?? ""}`.toLowerCase()
          return (filter as any).keywords.some((kw: string) => text.includes(kw))
        }).length
      }
    }
    return counts
  }, [mentors])

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
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar mentores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted/50"
          />
        </div>

        {/* Category Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted px-1">
            <Filter className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest">Especialidad</h3>
          </div>
          <div className="space-y-1">
            {FILTER_OPTIONS.map((filter, i) => (
              <motion.button 
                key={filter.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveFilter(filter.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border border-transparent ${
                  activeFilter === filter.id
                    ? "bg-accent-gro/5 text-accent-gro border-accent-gro/10"
                    : "hover:bg-muted/5 text-muted hover:text-foreground"
                }`}
              >
                <span>{filter.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeFilter === filter.id
                    ? "bg-accent-gro text-background font-black"
                    : "text-muted/40"
                }`}>
                  {filterCounts[filter.id] ?? 0}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Apply as Senior CTA */}
        <Link href="/apply-senior" className="block gro-card p-6 space-y-4 hover:border-amber-500 transition-all group">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold">¿Eres experto?</h4>
          <p className="text-xs text-muted leading-relaxed font-medium">Ayuda a otros a crecer y obtén la insignia de Senior Verificado.</p>
          <span className="text-xs font-bold text-amber-500 group-hover:underline">Postularme →</span>
        </Link>
      </motion.div>

      {/* Results */}
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between border-b border-border-gro pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight">
              {filteredMentors.length} <span className="text-muted font-medium">
                {filteredMentors.length === 1 ? "Mentor" : "Mentores"} {activeFilter !== "all" ? `en ${FILTER_OPTIONS.find(f=>f.id===activeFilter)?.label}` : "disponibles"}
              </span>
            </h1>
            <p className="text-sm text-muted font-medium">Expertos listos para ayudarte a escalar tus habilidades.</p>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="gro-btn !py-2 !px-4 !text-xs font-bold flex items-center gap-2"
            >
              {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
              <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-2 w-48 gro-card shadow-2xl z-50 overflow-hidden"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id); setShowSort(false) }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                          sortBy === opt.id ? "bg-accent-gro/5 text-accent-gro" : "text-muted hover:bg-muted/5 hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredMentors.map((mentor, i) => (
              <motion.div 
                key={mentor.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="gro-card p-6 group"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <Link href={`/profile/${mentor.id}`} className="w-16 h-16 rounded-2xl bg-muted/10 overflow-hidden border border-border-gro shrink-0 shadow-lg group-hover:shadow-xl transition-shadow">
                    <img src={mentor.image || "/White Isotype.png"} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </Link>
                  
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${mentor.id}`} className="text-lg font-black hover:text-accent-gro transition-colors tracking-tight truncate">
                            {mentor.name}
                          </Link>
                          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Senior</span>
                          <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Disponible</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/profile/${mentor.id}`} className="gro-btn gro-btn-primary !py-1.5 !px-4 !text-[11px] font-bold !rounded-full">
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
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{mentor.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500 shrink-0" />
                        {(4 + Math.random()).toFixed(1)} ({Math.floor(Math.random() * 80 + 10)})
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMentors.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center space-y-6 gro-card border-dashed bg-transparent"
            >
              <Search className="w-12 h-12 text-muted/20 mx-auto" />
              <div className="space-y-2">
                <p className="font-bold">No se encontraron mentores</p>
                <p className="text-muted text-sm">Prueba cambiando los filtros o tu búsqueda.</p>
              </div>
              <button onClick={() => { setActiveFilter("all"); setSearchQuery("") }} className="gro-btn !text-xs !rounded-full">
                Limpiar filtros
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
