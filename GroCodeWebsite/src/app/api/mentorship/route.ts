import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/verify-token"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const browse = searchParams.get("browse")

    // Browse mode: return all senior users (for Explore tab)
    if (browse === "true") {
      const seniors = await prisma.user.findMany({
        where: { role: "SENIOR" },
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(seniors)
    }

    // Default: return user's mentorship requests (requires auth)
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const mentorshipRequests = await prisma.mentorshipRequest.findMany({
      where: {
        OR: [
          { juniorId: decoded.id },
          { seniorId: decoded.id }
        ]
      },
      include: {
        junior: {
          select: { id: true, name: true, image: true }
        },
        senior: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(mentorshipRequests)
  } catch (error) {
    console.error("Fetch mentorship requests error:", error)
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

    if (!decoded || decoded.role !== "JUNIOR") {
      return NextResponse.json({ error: "Only Juniors can request mentorship" }, { status: 403 })
    }

    const { seniorId, message } = await request.json()

    if (!seniorId) {
      return NextResponse.json({ error: "Senior ID is required" }, { status: 400 })
    }

    const mentorshipRequest = await prisma.mentorshipRequest.create({
      data: {
        juniorId: decoded.id,
        seniorId,
        message,
      }
    })

    return NextResponse.json(mentorshipRequest)
  } catch (error) {
    console.error("Create mentorship request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== "SENIOR") {
      return NextResponse.json({ error: "Only Seniors can respond to requests" }, { status: 403 })
    }

    const { requestId, status } = await request.json()

    if (!requestId || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const updatedRequest = await prisma.mentorshipRequest.update({
      where: { id: requestId, seniorId: decoded.id },
      data: { status }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Update mentorship request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
