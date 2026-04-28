import { PrismaClient } from "../src/generated/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10)

  // Crear Mentores (Seniors)
  const mentors = [
    {
      name: "David 'DHH' Heinemeier",
      email: "david@rails.com",
      role: "SENIOR",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    },
    {
      name: "Guillermo Rauch",
      email: "guillermo@vercel.com",
      role: "SENIOR",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guillermo",
    },
    {
      name: "Sarah Drasner",
      email: "sarah@google.com",
      role: "SENIOR",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    {
      name: "Dan Abramov",
      email: "dan@meta.com",
      role: "SENIOR",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dan",
    }
  ]

  for (const m of mentors) {
    await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        ...m,
        password: hashedPassword,
      }
    })
  }

  // Crear Juniors
  const juniors = [
    {
      name: "Alex Dev",
      email: "alex@test.com",
      role: "JUNIOR",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    {
      name: "Maria Code",
      email: "maria@test.com",
      role: "JUNIOR",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    }
  ]

  for (const j of juniors) {
    const user = await prisma.user.upsert({
      where: { email: j.email },
      update: {},
      create: {
        ...j,
        password: hashedPassword,
      }
    })

    // Añadir algunos posts para los juniors/seniors
    await prisma.post.create({
      data: {
        content: "¡Hola a todos! Acabo de unirme a GroCode. Estoy buscando aprender Next.js y mejorar mis habilidades de arquitectura.",
        authorId: user.id,
      }
    })
  }

  // Posts de Seniors
  const seniorUsers = await prisma.user.findMany({ where: { role: "SENIOR" } })
  for (const s of seniorUsers) {
    await prisma.post.create({
      data: {
        content: `Acabo de publicar un nuevo recurso sobre ${s.name === 'Dan Abramov' ? 'React Server Components' : 'Clean Code'}. ¡Espero que les sirva!`,
        resourceUrl: "https://github.com/trending",
        authorId: s.id,
      }
    })
  }

  console.log("Seeding finished.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
