import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { mentorDirectorySelect, type MentorCard, type MentorDirectoryUser } from "@/lib/select"
import {
  FILTER_OPTIONS,
  MENTORS_PER_PAGE,
  matchesFilter,
  matchesSearch,
  sortMentors,
  type FilterId,
  type SortId,
} from "@/lib/mentor-filters"

/**
 * Cache tag for the senior directory.
 *
 * This is the piece `revalidatePath("/mentors")` cannot replace: that drops the
 * rendered HTML, while the query below lives in the Data Cache. Every write that
 * changes who appears in the directory (a senior application approved, a
 * profile edited) has to call `revalidateMentors()` as well.
 */
const MENTORS_TAG = "mentors"

/** Five minutes: long enough to matter on a public route, short enough to heal. */
const MENTORS_TTL = 300

/**
 * One query for every request to `/mentors`.
 *
 * `unstable_cache` keeps this out of the per-request path, which is the whole
 * point: the directory is public, has no viewer-dependent data and used to run
 * a full scan of the senior table on every hit.
 *
 * The whole list is fetched rather than filtered in SQL because the specialty
 * filters match keywords as whole words over `bio`+`name` — `go` has to match
 * "Golang" but not "amigo", and Prisma has no portable regex operator. The
 * in-memory pass keeps that behaviour and the sidebar counters exact.
 */
const fetchSeniors = unstable_cache(
  () =>
    prisma.user.findMany({
      where: { role: "SENIOR" },
      select: mentorDirectorySelect,
      orderBy: { createdAt: "desc" },
    }),
  ["mentor-directory"],
  { tags: [MENTORS_TAG], revalidate: MENTORS_TTL },
)

/**
 * `unstable_cache` stores its value with `JSON.stringify`, so a cache **hit**
 * returns `createdAt` as an ISO string, while a **miss** hands back the original
 * Prisma object with a `Date`. Normalising here is what keeps the rest of this
 * module down to a single shape — without it, sorting by "Más recientes" throws
 * a `TypeError` on the second request and only on the second request.
 */
function withRealDates(user: MentorDirectoryUser & { createdAt: string | Date }): MentorDirectoryUser {
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
  }
}

export interface MentorDirectoryQuery {
  q: string
  cat: FilterId
  sort: SortId
  page: number
}

export interface MentorDirectoryPage {
  mentors: MentorCard[]
  /** One entry per sidebar badge, counted with the same rule the query used. */
  counts: Record<FilterId, number>
  /** Mentors matching the current filters, not the mentors on this page. */
  total: number
  page: number
  totalPages: number
}

export async function getMentorDirectory(query: MentorDirectoryQuery): Promise<MentorDirectoryPage> {
  const rows = (await fetchSeniors()).map(withRealDates)

  const counts = Object.fromEntries(
    FILTER_OPTIONS.map((option) => [option.id, rows.filter((row) => matchesFilter(row, option)).length]),
  ) as Record<FilterId, number>

  const activeFilter = FILTER_OPTIONS.find((option) => option.id === query.cat) ?? FILTER_OPTIONS[0]
  const matches = rows.filter(
    (row) => matchesSearch(row, query.q) && matchesFilter(row, activeFilter),
  )

  const sorted = sortMentors(matches, query.sort)
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / MENTORS_PER_PAGE))
  // `?page=500` on a 2-page directory has to land somewhere real, or the user
  // gets an empty screen with no way back.
  const page = Math.min(query.page, totalPages)
  const start = (page - 1) * MENTORS_PER_PAGE

  const mentors = sorted.slice(start, start + MENTORS_PER_PAGE).map((row) => ({
    id: row.id,
    name: row.name,
    image: row.image,
    bio: row.bio,
    location: row.location,
  }))

  return { mentors, counts, total, page, totalPages }
}

/**
 * Invalidates the directory after a write that changes it.
 *
 * Called from server actions. `revalidatePath("/mentors")` alone leaves this
 * cache entry in place, so a newly approved senior would not show up until the
 * TTL expired.
 *
 * The second argument is the window in which Next is allowed to keep serving
 * the stale entry. `"max"` is the documented default and would let an admin who
 * just approved someone open `/mentors` and still see the old list while the
 * refresh runs in the background; `{ expire: 0 }` makes the next request block
 * until it has the new data, which is what a deliberate write asks for.
 * `updateTag()` would do the same but throws outside a Server Action.
 */
export function revalidateMentors(): void {
  revalidateTag(MENTORS_TAG, { expire: 0 })
}
