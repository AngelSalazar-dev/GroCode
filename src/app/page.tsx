import { prisma } from "@/lib/prisma"
import HomeContent from "@/components/home/HomeContent"

// The landing page shows live counts, so it cannot be prerendered at build time.
export const dynamic = "force-dynamic"

export default async function Home() {
  const [mentorCount, resourceCount, memberCount] = await Promise.all([
    prisma.user.count({ where: { role: "SENIOR" } }),
    prisma.post.count(),
    prisma.user.count(),
  ])

  return <HomeContent stats={{ mentorCount, resourceCount, memberCount }} />
}