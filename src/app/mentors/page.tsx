import { prisma } from "@/lib/prisma"
import MentorsList from "@/components/mentors/MentorsList"

export default async function MentorsPage() {
  const seniors = await prisma.user.findMany({
    where: { role: "SENIOR" },
    orderBy: { createdAt: "desc" }
  })

  return <MentorsList mentors={seniors} />
}
