import MentorsList from "@/components/mentors/MentorsList"
import { getMentorDirectory } from "@/lib/mentors"
import { isFilterId, isSortId, MAX_SEARCH_LENGTH } from "@/lib/mentor-filters"
import { parsePage } from "@/lib/paging"

export const metadata = {
  title: "Mentores - GroCode",
  description: "Conecta con desarrolladores Senior verificados listos para darte mentoría.",
}

// The directory reads live data, so it must not be baked at build time.
export const dynamic = "force-dynamic"

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string; page?: string }>
}) {
  const params = await searchParams

  // Everything here is untrusted: unknown `cat`/`sort` values fall back to the
  // default rather than matching nothing, and `q` is bounded before it is used
  // to walk the directory in memory.
  const q = (params.q ?? "").trim().slice(0, MAX_SEARCH_LENGTH)
  const cat = isFilterId(params.cat) ? params.cat : "all"
  const sort = isSortId(params.sort) ? params.sort : "name-asc"
  const page = parsePage(params.page)

  const directory = await getMentorDirectory({ q, cat, sort, page })

  return <MentorsList {...directory} query={{ q, cat, sort }} />
}
