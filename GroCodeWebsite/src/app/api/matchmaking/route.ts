import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = 10

  const projects = await prisma.project.findMany({
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        }
      },
      skills: true,
      _count: {
        select: {
          collaborators: true,
          requests: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const nextCursor = projects.length === limit ? projects[projects.length - 1].id : null

  return NextResponse.json({
    projects,
    nextCursor,
  })
}
