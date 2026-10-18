"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, User, FileText, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { search } from "@/actions/search"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ users: any[]; posts: any[] }>({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true)
        try {
          const data = await search(query)
          setResults(data)
          setShowResults(true)
        } catch {
          // silently fail
        } finally {
          setLoading(false)
        }
      } else {
        setResults({ users: [], posts: [] })
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const hasResults = results.users.length > 0 || results.posts.length > 0

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="flex items-center bg-muted/5 border border-border-gro rounded-full px-4 py-2 gap-2 w-52 focus-within:border-accent-gro focus-within:w-64 transition-all duration-300">
        <Search className="w-3.5 h-3.5 text-muted shrink-0" />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Buscar recursos..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="bg-transparent border-none outline-none text-xs w-full placeholder:text-muted/50"
        />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults({ users: [], posts: [] }); setShowResults(false) }} className="text-muted hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full mt-2 w-80 gro-card shadow-2xl z-50 overflow-hidden"
          >
            {!hasResults && !loading ? (
              <div className="p-4 text-center">
                <p className="text-xs text-muted font-medium">No se encontraron resultados</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {results.users.length > 0 && (
                  <div className="p-2">
                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">Usuarios</p>
                    {results.users.map(user => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        onClick={() => { setShowResults(false); setQuery("") }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted/10 overflow-hidden shrink-0">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-full h-full p-2 text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{user.name}</p>
                          <p className="text-[10px] text-muted truncate">{user.bio || user.role}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {results.posts.length > 0 && (
                  <div className="p-2 border-t border-border-gro">
                    <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">Publicaciones</p>
                    {results.posts.map(post => (
                      <button
                        key={post.id}
                        onClick={() => { setShowResults(false); setQuery(""); router.push("/feed") }}
                        className="w-full flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-muted/5 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{post.author.name}</p>
                          <p className="text-[10px] text-muted line-clamp-2">{post.content}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
