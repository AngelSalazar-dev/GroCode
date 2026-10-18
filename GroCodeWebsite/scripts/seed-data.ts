import { PrismaClient } from '../src/generated-v4/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  const founderEmail = 'angeluqui2017@gmail.com'

  // 1. Create or get some skills
  const skillNames = ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'Prisma', 'MySQL', 'Docker', 'AWS']
  const skills = await Promise.all(
    skillNames.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  // 2. Inject Roadmap Resources (Posts)
  const roadmapResources = [
    {
      content: 'Guía definitiva de Fundamentos Web: Protocolos, DNS y Navegadores. ¡Indispensable para empezar!',
      channel: 'general',
      resourceUrl: 'https://developer.mozilla.org/es/docs/Learn/Getting_started_with_the_web/How_the_Web_works',
    },
    {
      content: 'Mastering Flexbox y Grid: La guía visual que necesitabas para dominar CSS Layouts.',
      channel: 'general',
      resourceUrl: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    },
    {
      content: 'Conceptos avanzados de JavaScript: Closures, Event Loop y Promesas explicados con peras y manzanas.',
      channel: 'javascript',
      resourceUrl: 'https://javascript.info/',
    },
    {
      content: 'Curso acelerado de React 19: Todo lo nuevo, desde hooks hasta Server Components.',
      channel: 'react',
      resourceUrl: 'https://react.dev/blog/2024/12/05/react-19',
    },
    {
      content: 'Arquitectura de Backend con Node.js y Prisma: Cómo escalar tu base de datos sin morir en el intento.',
      channel: 'backend',
      resourceUrl: 'https://www.prisma.io/docs/concepts/overview/what-is-prisma',
    },
    {
      content: 'Desplegando aplicaciones Next.js en Vercel y Docker: De local a producción en minutos.',
      channel: 'devops',
      resourceUrl: 'https://nextjs.org/docs/app/building-your-application/deploying',
    },
  ]

  // Use founder as author
  let systemUser = await prisma.user.findFirst({
    where: { email: founderEmail }
  })

  if (!systemUser) {
    console.log('Error: Founder user not found. Please log in first.')
    return
  }

  for (const res of roadmapResources) {
    await prisma.post.create({
      data: {
        ...res,
        authorId: systemUser.id,
      }
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
