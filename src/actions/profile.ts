"use server"

import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface ProfileData {
  name: string
  bio: string
  location: string
  website: string
  image?: string
}

export async function updateProfile(data: ProfileData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name || undefined,
      bio: data.bio || null,
      location: data.location || null,
      website: data.website || null,
      image: data.image || undefined,
    },
  })

  revalidatePath(`/profile/${session.user.id}`)
  revalidatePath("/feed")
  revalidatePath("/mentors")
}
