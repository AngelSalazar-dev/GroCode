import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /post/* and /profile/* are intentionally crawlable — the sitemap
        // lists them, and both are public (see PUBLIC_PATHS in src/proxy.ts).
        // Only the personal, transactional surfaces are excluded.
        disallow: ["/api/", "/feed", "/feed/new", "/notifications", "/onboarding", "/admin/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}