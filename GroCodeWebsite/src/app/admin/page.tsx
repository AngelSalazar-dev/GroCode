import { prisma } from "@/lib/prisma"
import { auth } from "@/auth/auth"
import { redirect } from "next/navigation"
import AdminClient from "./AdminClient"

const FOUNDER_EMAIL = "angeluqui2017@gmail.com"

export default async function AdminPage() {
  const session = await auth()
  
  const isFounder = session?.user?.email === FOUNDER_EMAIL
  
  // Check if ADMIN role
  const dbUser = await prisma.user.findUnique({
    where: { id: session?.user?.id || "" },
    select: { role: true }
  })

  const isAdmin = dbUser?.role === "ADMIN"

  if (!isFounder && !isAdmin) {
    redirect("/feed")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <AdminClient 
      users={users} 
      currentUserId={session?.user?.id}
      founderEmail={FOUNDER_EMAIL}
    />
  )
}
