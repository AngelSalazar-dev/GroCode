"use server"

import { prisma } from "@/lib/prisma"

export async function search(query: string) {
  if (!query || query.length < 2) return { users: [], posts: [] }

  const [users, posts] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { bio: { contains: query } },
        ]
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
      },
      take: 5,
    }),
    prisma.post.findMany({
      where: {
        content: { contains: query }
      },
      include: {
        author: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ])

  return { users, posts }
}
