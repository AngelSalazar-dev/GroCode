import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import HomeContent from "@/components/home/HomeContent"

// The landing page shows live counts, so it cannot be prerendered at build time.
export const dynamic = "force-dynamic"

export default async function Home() {
  let mentorCount = 0
  let resourceCount = 0
  let memberCount = 0

  try {
    const [mCount, rCount, memCount] = await Promise.all([
      prisma.user.count({ where: { role: "SENIOR" } }),
      prisma.post.count(),
      prisma.user.count(),
    ])
    mentorCount = mCount
    resourceCount = rCount
    memberCount = memCount
  } catch (error) {
    logger.error("home.db_unavailable", { error })
  }

  return <HomeContent stats={{ mentorCount, resourceCount, memberCount }} />
}