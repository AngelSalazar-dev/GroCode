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
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        postId: id,
        userId: decoded.id,
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.like.create({
        data: {
          postId: id,
          userId: decoded.id,
        },
      })

      if (post && post.authorId !== decoded.id) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            message: `${decoded.name || "Alguien"} liked your post`,
            userId: post.authorId,
            link: `/post/${id}`,
          },
        })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Like/unlike error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
