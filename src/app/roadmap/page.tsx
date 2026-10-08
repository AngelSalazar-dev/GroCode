import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import RoadmapClient from "@/components/roadmap/RoadmapClient"
import { CHANNELS } from "@/lib/channels"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Roadmap - GroCode",
  description: "La ruta de aprendizaje colaborativa construida y validada por la comunidad de GroCode.",
}

export default async function RoadmapPage() {
  const session = await auth()

  const steps = await prisma.roadmapStep.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      color: true,
      order: true,
      resources: true,
      progress: session?.user?.id
        ? {
            where: { userId: session.user.id },
            select: { completed: true },
          }
        : false,
    },
    orderBy: { order: "asc" },
  })

  const serialized = steps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    color: step.color,
    order: step.order,
    resources: step.resources,
    completed: step.progress[0]?.completed ?? false,
    // Only recommend feed content for channels that actually exist.
    channel: CHANNELS[Math.min(step.order, CHANNELS.length - 1)].id,
  }))

  const completedCount = serialized.filter((s) => s.completed).length

  return (
    <RoadmapClient
      steps={serialized}
      completedCount={completedCount}
      isLoggedIn={!!session}
    />
  )
}