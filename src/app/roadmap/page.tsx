import { prisma } from "@/lib/prisma"
import RoadmapClient from "@/components/roadmap/RoadmapClient"

export const dynamic = "force-dynamic"

export default async function RoadmapPage() {
  const steps = await prisma.roadmapStep.findMany({
    orderBy: { order: "asc" },
  })

  return <RoadmapClient steps={steps} />
}