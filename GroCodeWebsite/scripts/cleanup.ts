import { PrismaClient } from '../src/generated-v4/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpiando base de datos...')

  const founderEmail = 'angeluqui2017@gmail.com'

  // Delete all users except the founder
  // Prisma will cascade delete posts, likes, etc. if relations are set up correctly in schema.
  // Looking at schema, onDelete: Cascade is used in many places.
  
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        not: founderEmail
      }
    }
  })

  console.log(`Se eliminaron ${deletedUsers.count} usuarios y sus datos asociados.`)
  console.log('Limpieza completada.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
