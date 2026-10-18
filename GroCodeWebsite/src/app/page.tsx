import { prisma } from "@/lib/prisma"
import HomeClient from "@/components/landing/HomeClient"

export default async function Home() {
  const [mentorsCount, usersCount, postsCount] = await Promise.all([
    prisma.user.count({ where: { role: "SENIOR" } }),
    prisma.user.count(),
    prisma.post.count(),
  ])

  return (
    <HomeClient
      stats={{
        mentors: mentorsCount,
        users: usersCount,
        posts: postsCount,
      }}
    />
  )
}
