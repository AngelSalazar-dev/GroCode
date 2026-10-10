/**
 * Rules for the mentor directory: which mentors a specialty matches, how the
 * list is ordered, how big a page is, and how its URL is built.
 *
 * Deliberately free of Prisma, Next and React imports. The server decides the
 * result and the client only renders it, but the sidebar badges and the query
 * have to agree on what "Front-end" means, and rules this small are worth
 * testing without a database.
 */

export type FilterId = "all" | "frontend" | "backend" | "devops" | "mobile" | "data"

export type SortId = "name-asc" | "name-desc" | "newest" | "oldest"

export type FilterOption =
  | { id: "all"; label: string }
  | { id: Exclude<FilterId, "all">; label: string; keywords: readonly string[] }

export const FILTER_OPTIONS: readonly FilterOption[] = [
  { id: "all", label: "Todos" },
  { id: "frontend", label: "Front-end", keywords: ["react","vue","angular","svelte","next","css","tailwind","frontend"] },
  { id: "backend", label: "Back-end", keywords: ["node","django","spring","express","rails","laravel","go","rust","backend","postgresql","api"] },
  { id: "devops", label: "DevOps", keywords: ["docker","kubernetes","aws","gcp","azure","ci/cd","pipeline","devops","cloud"] },
  { id: "mobile", label: "Mobile", keywords: ["react native","flutter","swift","ios","android","dart","mobile"] },
  { id: "data", label: "Data / AI", keywords: ["python","tensorflow","ml","ai","data","pandas","scikit","machine learning","spark","etl"] },
]

export const SORT_OPTIONS: readonly { id: SortId; label: string }[] = [
  { id: "name-asc", label: "Nombre (A-Z)" },
  { id: "name-desc", label: "Nombre (Z-A)" },
  { id: "newest", label: "Más recientes" },
  { id: "oldest", label: "Más antiguos" },
]

/**
 * One screenful. The old directory rendered every senior at once, which locked
 * up scrolling on mobile: `AnimatePresence mode="popLayout"` measures every
 * card on every keystroke.
 */
export const MENTORS_PER_PAGE = 12

/** Longest `q` the directory will accept, so the in-memory pass stays bounded. */
export const MAX_SEARCH_LENGTH = 100

/** The minimum a mentor has to expose for the rules below to apply. */
export interface DirectoryFilterable {
  name: string | null
  bio: string | null
  location?: string | null
}

export interface DirectoryFilterableAndDated extends DirectoryFilterable {
  createdAt: Date
}

/**
 * Match a keyword as a whole word. A plain `includes("go")` also hits
 * "categoría", "programación", "Golang", etc.
 */
export function matchesKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`, "i").test(text)
}

export function matchesFilter(mentor: DirectoryFilterable, filter: FilterOption): boolean {
  if (filter.id === "all") return true
  const text = `${mentor.bio ?? ""} ${mentor.name ?? ""}`.toLowerCase()
  return filter.keywords.some((kw) => matchesKeyword(text, kw))
}

/**
 * Free-text search. Unlike the specialty filters this is a plain substring
 * match over three fields, which is what typing in a search box expects.
 */
export function matchesSearch(mentor: DirectoryFilterable, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true
  return (
    (mentor.name ?? "").toLowerCase().includes(query) ||
    (mentor.bio ?? "").toLowerCase().includes(query) ||
    (mentor.location ?? "").toLowerCase().includes(query)
  )
}

export function sortMentors<T extends DirectoryFilterableAndDated>(list: T[], sort: SortId): T[] {
  const sorted = [...list]
  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      break
    case "name-desc":
      sorted.sort((a, b) => (b.name ?? "").localeCompare(a.name ?? ""))
      break
    case "newest":
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      break
    case "oldest":
      sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      break
  }
  return sorted
}

/** Untrusted `searchParams` fall back to the default instead of matching nothing. */
export function isFilterId(value: unknown): value is FilterId {
  return FILTER_OPTIONS.some((option) => option.id === value)
}

export function isSortId(value: unknown): value is SortId {
  return SORT_OPTIONS.some((option) => option.id === value)
}

export interface DirectoryQuery {
  q: string
  cat: FilterId
  sort: SortId
}

/**
 * Builds the canonical URL for a directory state.
 *
 * Defaults are omitted so the first page is `/mentors` and every other
 * combination is shareable — the same shape `page.tsx` parses back, so a URL
 * round-trips without drifting.
 */
export function directoryUrl(query: DirectoryQuery, page: number): string {
  const params = new URLSearchParams()
  const trimmed = query.q.trim()
  if (trimmed) params.set("q", trimmed)
  if (query.cat !== "all") params.set("cat", query.cat)
  if (query.sort !== "name-asc") params.set("sort", query.sort)
  if (page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `/mentors?${search}` : "/mentors"
}
