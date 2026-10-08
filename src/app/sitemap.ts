import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // AUTH_URL, not NEXTAUTH_URL: NextAuth v5 renamed it.
  const base = process.env.AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/mentors`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/roadmap`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/auth/signin`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/auth/register`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/apply-senior`, changeFrequency: "monthly", priority: 0.6 },
  ]

  try {
    // Only surface posts that belong to a real account; drafts do not exist yet
    // but keeping the query scoped avoids leaking unknown rows later.
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        createdAt: true,
        author: { select: { id: true, role: true } },
      },
      take: 500,
      orderBy: { createdAt: "desc" },
    })

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${base}/post/${post.id}`,
      lastModified: post.createdAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }))

    const seniors = await prisma.user.findMany({
      where: { role: "SENIOR" },
      select: { id: true, updatedAt: true },
      take: 200,
    })

    const mentorRoutes: MetadataRoute.Sitemap = seniors.map((senior) => ({
      url: `${base}/profile/${senior.id}`,
      lastModified: senior.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }))

    return [...staticRoutes, ...postRoutes, ...mentorRoutes]
  } catch {
    // A DB hiccup must not take down /sitemap.xml.
    return staticRoutes
  }
}