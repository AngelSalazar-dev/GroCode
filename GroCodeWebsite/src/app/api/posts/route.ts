import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/verify-token"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10)
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 20
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.post.count(),
    ])
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    })
  } catch (error) {
    console.error("Fetch posts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, resourceUrl } = await request.json()
    const normalizedContent = typeof content === "string" ? content.trim() : ""

    if (!normalizedContent || normalizedContent.length > 5000) {
      return NextResponse.json(
        { error: "Content must be between 1 and 5000 characters" },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        content: normalizedContent,
        resourceUrl: typeof resourceUrl === "string" ? resourceUrl.trim() || null : null,
        authorId: decoded.id,
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
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
