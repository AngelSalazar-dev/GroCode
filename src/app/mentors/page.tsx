import { prisma } from "@/lib/prisma"
import { publicUserSelect } from "@/lib/select"
import MentorsList from "@/components/mentors/MentorsList"

export const metadata = {
  title: "Mentores - GroCode",
  description: "Conecta con desarrolladores Senior verificados listos para darte mentoría.",
}

// The mentor directory reads live data, so it must not be baked at build time.
export const dynamic = "force-dynamic"

export default async function MentorsPage() {
  const seniors = await prisma.user.findMany({
    where: { role: "SENIOR" },
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
  })

  return <MentorsList mentors={seniors} />
}
