import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { bio: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          bio: true,
        },
        take: 10,
      }),
      prisma.post.findMany({
        where: {
          content: { contains: query },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ])

    return NextResponse.json({ users, posts })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
