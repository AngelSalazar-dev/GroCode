import { prisma } from "@/lib/prisma"
import MentorsList from "@/components/mentors/MentorsList"

export default async function MentorsPage() {
  const seniors = await prisma.user.findMany({
    where: { role: "SENIOR" },
    orderBy: { createdAt: "desc" },
    include: {
      reviewsReceived: {
        select: { rating: true }
      }
    }
  })

  const mentorsWithStats = seniors.map(mentor => {
    const reviews = mentor.reviewsReceived
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    return {
      ...mentor,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    }
  })

  return <MentorsList mentors={mentorsWithStats} />
}
