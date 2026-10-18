import { auth } from "@/auth/auth"
import { prisma } from "@/lib/prisma"
import RequestButtonClient from "./RequestButtonClient"

interface MentorRequestButtonProps {
  seniorId: string
  seniorRole: string
}

export default async function MentorRequestButton({ seniorId, seniorRole }: MentorRequestButtonProps) {
  const session = await auth()

  // 1. Solo se muestra si el usuario logueado es JUNIOR
  if (session?.user?.role !== "JUNIOR") return null

  // 2. Solo se muestra en perfiles de usuarios con rol SENIOR
  if (seniorRole !== "SENIOR") return null

  // 3. No mostrar en el propio perfil (redundante por lógica de roles pero seguro)
  if (session.user.id === seniorId) return null

  // Verificar si ya existe una solicitud para cambiar el estado del botón
  const pendingRequest = await prisma.mentorshipRequest.findUnique({
    where: {
      juniorId_seniorId: {
        juniorId: session.user.id,
        seniorId: seniorId
      }
    }
  })

  return (
    <RequestButtonClient 
      seniorId={seniorId} 
      hasPendingRequest={!!pendingRequest} 
    />
  )
}
