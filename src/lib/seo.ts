import { PrismaClient } from "@/generated-v2/client"

const prisma = new PrismaClient()

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}) {
  const user = await prisma.user.findUnique({ where: { id: params.id } })

  if (!user) {
    return {
      title: "Perfil no encontrado",
      description: "El perfil solicitado no existe.",
    }
  }

  return {
    title: `${user.name || "Usuario"} - Perfil de ${user.role}`,
    description: user.bio || `Perfil de ${user.role} en GroCode`,
    keywords: ["perfil", user.role?.toLowerCase() || "user", "grocode"],
    authors: [{ name: user.name || "Usuario" }],
  }
}