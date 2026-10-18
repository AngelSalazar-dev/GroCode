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

    if (decoded.id === id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.id,
          followingId: id,
        },
      },
    })

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: decoded.id,
            followingId: id,
          },
        },
      })
      return NextResponse.json({ following: false })
    } else {
      await prisma.follow.create({
        data: {
          followerId: decoded.id,
          followingId: id,
        },
      })

      await prisma.notification.create({
        data: {
          type: "FOLLOW",
          message: `${decoded.name || "Alguien"} began following you`,
          userId: id,
          link: `/profile/${decoded.id}`,
        },
      })

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("Follow/unfollow error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
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

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.id,
          followingId: id,
        },
      },
    })

    return NextResponse.json({ following: !!follow })
  } catch (error) {
    console.error("Check follow error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
