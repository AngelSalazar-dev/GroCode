import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/verify-token"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        postId: id,
        userId: decoded.id,
      },
    })

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      })
      return NextResponse.json({ bookmarked: false })
    } else {
      await prisma.bookmark.create({
        data: {
          postId: id,
          userId: decoded.id,
        },
      })
      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error("Bookmark/unbookmark error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
