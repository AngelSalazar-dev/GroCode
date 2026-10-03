import { PrismaClient } from "../src/generated-v2/client"

const prisma = new PrismaClient()

const ROADMAP_STEPS = [
  {
    title: "Fundamentos de la Web",
    description: "Aprende cómo funciona el internet, navegadores y DNS.",
    color: "text-amber-500",
    order: 1,
    resources: 12,
  },
  {
    title: "HTML & CSS",
    description: "Estructura y diseño de páginas web responsivas.",
    color: "text-sky-500",
    order: 2,
    resources: 45,
  },
  {
    title: "JavaScript Avanzado",
    description: "Lógica, manipulación del DOM, asincronía y APIs.",
    color: "text-yellow-500",
    order: 3,
    resources: 38,
  },
  {
    title: "Frameworks Frontend (React/Next.js)",
    description: "Construcción de interfaces interactivas y SSR.",
    color: "text-cyan-500",
    order: 4,
    resources: 60,
  },
  {
    title: "Backend & Bases de Datos",
    description: "Creación de APIs, autenticación y modelado de datos.",
    color: "text-emerald-500",
    order: 5,
    resources: 25,
  },
  {
    title: "Despliegue y DevOps Básicos",
    description: "CI/CD, Docker, AWS/Vercel y buenas prácticas.",
    color: "text-indigo-500",
    order: 6,
    resources: 18,
  },
]

async function main() {
  console.log("Seeding roadmap steps...")

  for (const step of ROADMAP_STEPS) {
    await prisma.roadmapStep.upsert({
      where: { id: `roadmap-${step.order}` },
      update: step,
      create: {
        id: `roadmap-${step.order}`,
        ...step,
      },
    })
  }

  console.log("Roadmap steps seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })