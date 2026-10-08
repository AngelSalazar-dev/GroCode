/**
 * Feed pagination bounds, shared by the page and the tests.
 *
 * An unbounded `?page=` produces a `skip` the database must walk before
 * discarding: `?page=100000000` asks for ~1e9 skipped rows on an unthrottled,
 * uncached route. Cheap to exploit, so the value is clamped.
 */
export const MAX_PAGE = 500

export const FEED_TAKE = 10

/**
 * Parses the `page` search param defensively.
 *
 * `Number.parseInt("abc")` is `NaN`, and a `NaN` skip makes Prisma throw
 * rather than return an empty page.
 */
export function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "1", 10)
  if (!Number.isSafeInteger(parsed) || parsed < 1) return 1
  return Math.min(parsed, MAX_PAGE)
}