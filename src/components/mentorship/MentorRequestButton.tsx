import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import RequestButtonClient from "./RequestButtonClient"
import type { RequestStatus, Role } from "@/generated-v2/client"

interface MentorRequestButtonProps {
  seniorId: string
  seniorRole: Role
}

/**
 * Decides which of the two mentorship surfaces the current viewer gets.
 *
 * The order of these branches matters. The previous version returned null when
 * `session.user.id === seniorId` *before* the branch that required exactly
 * that condition, so the accept/reject panel was unreachable and
 * respondToMentorshipRequest was dead code.
 */
export default async function MentorRequestButton({
  seniorId,
  seniorRole,
}: MentorRequestButtonProps) {
  const session = await auth()

  if (!session?.user) return null

  // 1. Viewer is the Senior on their own profile: show pending requests.
  if (session.user.id === seniorId) {
    if (session.user.role !== "SENIOR") return null

    const incoming = await prisma.mentorshipRequest.findFirst({
      where: { seniorId, status: "PENDING" },
      select: {
        id: true,
        juniorId: true,
        junior: { select: { name: true } },
        message: true,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!incoming) return null

    return (
      <RequestButtonClient
        seniorId={seniorId}
        sentRequestStatus={null}
        incomingRequest={{
          id: incoming.id,
          juniorId: incoming.juniorId,
          juniorName: incoming.junior.name,
          message: incoming.message,
        }}
      />
    )
  }

  // 2. Viewer is a Junior looking at a Senior's profile.
  if (session.user.role === "JUNIOR" && seniorRole === "SENIOR") {
    const sent = await prisma.mentorshipRequest.findUnique({
      where: {
        juniorId_seniorId: { juniorId: session.user.id, seniorId },
      },
      select: { status: true },
    })

    return (
      <RequestButtonClient
        seniorId={seniorId}
        sentRequestStatus={(sent?.status ?? null) as RequestStatus | null}
        incomingRequest={null}
      />
    )
  }

  return null
}