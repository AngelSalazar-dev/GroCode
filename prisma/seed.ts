import { PrismaClient } from "../src/generated-v2/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ======= Data pools =======
const FIRST_NAMES = [
  "Carlos","María","José","Ana","Luis","Laura","Miguel","Carmen","Pedro","Sofía",
  "Diego","Elena","Pablo","Lucía","Andrés","Marta","Raúl","Isabel","Tomás","Valentina",
  "Adrián","Camila","Ricardo","Julia","Fernando","Paula","Javier","Daniela","Gabriel","Natalia",
  "Alejandro","Fernanda","Mateo","Carolina","Emilio","Sara","Rodrigo","Mariana","Óscar","Andrea",
  "Bruno","Clara","Hugo","Renata","Iván","Lorena","Sergio","Diana","Ramón","Rosa",
  "Esteban","Jimena","Marcos","Paola","Daniel","Gabriela","Samuel","Marina","Nicolás","Valeria",
  "Arturo","Elisa","César","Monserrat","Fabián","Ivana","Gonzalo","Alicia","Héctor","Teresa",
  "Ignacio","Brenda","Jorge","Cecilia","Kevin","Viviana","Leonardo","Ximena","Manuel","Yolanda",
  "Néstor","Alejandra","Octavio","Belinda","Patricio","Catalina","Quintín","Dolores","Rafael","Estefanía",
  "Salvador","Fabiola","Ulises","Graciela","Vicente","Helena","Wilfredo","Irene","Xavier","Jazmín"
]

const LAST_NAMES = [
  "García","Rodríguez","Martínez","López","Hernández","González","Pérez","Sánchez","Ramírez","Torres",
  "Flores","Rivera","Gómez","Díaz","Cruz","Morales","Reyes","Jiménez","Ruiz","Ortiz",
  "Vargas","Mendoza","Castillo","Romero","Medina","Chávez","Guerrero","Salazar","Aguilar","Campos",
  "Vega","Rojas","Ramos","Delgado","Navarro","Cabrera","Molina","Carrasco","León","Alvarado",
  "Ríos","Gutiérrez","Santos","Paredes","Miranda","Figueroa","Espinoza","Acosta","Contreras","Silva"
]

const BIOS_SENIOR = [
  "Arquitecto de software con más de 10 años en la industria. Especializado en sistemas distribuidos y microservicios.",
  "Lead Developer en startups de Silicon Valley. Apasionado por React y el ecosistema JavaScript moderno.",
  "Ex-Google. Enfocado en performance web y experiencias de usuario de clase mundial.",
  "DevOps Engineer con experiencia en AWS, GCP y Kubernetes. Construyo pipelines que escalan.",
  "Full-stack developer con foco en TypeScript y Next.js. Mentor de más de 50 desarrolladores.",
  "Especialista en IA/ML con Python y TensorFlow. He publicado papers en NeurIPS y ICML.",
  "CTO de una fintech en crecimiento. Amo enseñar arquitectura limpia y patrones de diseño.",
  "Backend engineer. Rust, Go y PostgreSQL son mi stack principal. Contribuyo a proyectos open source.",
  "Mobile developer con 8 años en React Native y Flutter. He publicado apps con millones de usuarios.",
  "Ingeniera de datos en Spotify. ETL pipelines, Spark y data lakes son mi día a día.",
  "Security researcher y pentester certificado. OWASP Top 10 es mi biblia.",
  "Platform engineer construyendo herramientas para developers. Ex-Meta, ex-Stripe.",
  "Fundador de una EdTech con 100k+ usuarios. Next.js, Prisma y TiDB en producción.",
  "Game developer con Unity y Unreal Engine. 15 años en la industria de videojuegos.",
  "Cloud architect certificado AWS y Azure. Diseño infraestructuras que procesan millones de requests.",
]

const BIOS_JUNIOR = [
  "Aprendiendo desarrollo web con React y Node.js. Busco mi primer empleo en tech.",
  "Estudiante de CS interesado en frontend moderno. Practicando con proyectos personales.",
  "Bootcamp grad aprendiendo TypeScript. Me encanta el diseño de interfaces.",
  "Desarrollador autodidacta transitando de otra carrera. Python y datos me apasionan.",
  "Junior frontend developer. Aprendiendo Next.js y Tailwind CSS a diario.",
  "Recién graduado en Ingeniería de Software. Busco mentoría en backend development.",
  "Aprendiendo DevOps y CI/CD. Docker es mi nuevo mejor amigo.",
  "Estudiante enfocada en mobile development con Flutter. Primer año en programación.",
  "Aspirante a data scientist. Aprendiendo pandas, numpy y scikit-learn.",
  "Junior dev con 6 meses de experiencia. React, CSS y muchas ganas de crecer.",
]

const TECHS = [
  "React, TypeScript, Node.js",
  "Python, Django, PostgreSQL",
  "Next.js, Prisma, TailwindCSS",
  "Vue.js, Nuxt, Firebase",
  "Go, gRPC, Kubernetes",
  "Rust, WebAssembly, Systems",
  "Swift, iOS, Core Data",
  "Java, Spring Boot, AWS",
  "Flutter, Dart, Mobile",
  "C#, .NET, Azure",
  "Ruby, Rails, Redis",
  "PHP, Laravel, MySQL",
  "Angular, RxJS, NgRx",
  "Svelte, SvelteKit, Vercel",
  "Elixir, Phoenix, LiveView",
]

const LOCATIONS = [
  "Ciudad de México, México","Buenos Aires, Argentina","Madrid, España","Bogotá, Colombia",
  "Lima, Perú","Santiago, Chile","Barcelona, España","Medellín, Colombia","Remote / Global",
  "Monterrey, México","San José, Costa Rica","Quito, Ecuador","São Paulo, Brasil",
  "Guadalajara, México","Montevideo, Uruguay","La Paz, Bolivia","Asunción, Paraguay",
  "San Francisco, USA","New York, USA","London, UK","Berlin, Germany","Toronto, Canada",
]

const POST_CONTENTS = [
  "🚀 Acabo de terminar un tutorial increíble sobre React Server Components. Los RSC cambian completamente cómo pensamos sobre la hidratación.",
  "📚 Recurso compartido: Guía completa de TypeScript 5.5 con las nuevas features de inferencia de tipos.",
  "💡 Tip del día: Usa `useMemo` solo cuando realmente lo necesites. La optimización prematura es la raíz de todos los males.",
  "🔥 Completé mi primer proyecto full-stack con Next.js 16 + Prisma + TiDB. ¡La velocidad de desarrollo es insana!",
  "🎯 Mi roadmap para pasar de Junior a Mid en 6 meses: DSA, System Design, y contribuir a open source.",
  "🐍 Python tip: List comprehensions son hasta 10x más rápidas que los loops for en ciertos escenarios.",
  "⚛️ El nuevo compilador de React es una revolución. Memoización automática = menos boilerplate.",
  "🛠️ Docker + Docker Compose simplificaron mi workflow de desarrollo local tremendamente.",
  "📖 Estoy leyendo 'Clean Architecture' de Robert C. Martin. Cada capítulo cambia cómo diseño mis sistemas.",
  "🎨 TailwindCSS v4 con el nuevo @theme es increíblemente poderoso. Custom design systems en minutos.",
  "🔐 Nunca almacenes secrets en tu código. Usa variables de entorno y servicios como Vault o AWS Secrets Manager.",
  "🌐 WebSockets vs Server-Sent Events: Cuándo usar cada uno. Thread completo con ejemplos.",
  "⚡ Optimicé el LCP de mi sitio de 4.2s a 0.8s solo con lazy loading y preconnect. El rendimiento importa.",
  "📊 Mi experiencia migrando de MongoDB a PostgreSQL: pros, contras y lecciones aprendidas.",
  "🤖 Integré GPT-4 en mi app con streaming de respuestas. El UX con AI es fascinante.",
  "🧪 Testing no es opcional: Jest + Testing Library me salvaron de 47 bugs en producción este mes.",
  "🎓 Completé el curso de System Design de ByteByteGo. Lo recomiendo para preparar entrevistas técnicas.",
  "💻 Mi setup de desarrollo: VSCode + Warp terminal + Arc browser + Copilot. Productividad x10.",
  "🔄 CI/CD con GitHub Actions: Mi pipeline ejecuta tests, lint, build y deploy en 3 minutos.",
  "🏗️ Microservicios vs Monolito: No siempre necesitas microservicios. Empieza simple, escala después.",
  "📱 React Native vs Flutter en 2026: Análisis técnico después de 2 años usando ambos.",
  "🗃️ Prisma ORM ha madurado muchísimo. Las relaciones, migraciones y type safety son de primer nivel.",
  "🔍 SEO técnico para developers: Core Web Vitals, meta tags dinámicos y sitemap generation.",
  "🧠 Machine Learning no requiere un PhD. Scikit-learn + buenos datasets = resultados reales.",
  "🎯 Completé 100 problemas de LeetCode este mes. Pattern recognition > memorizar soluciones.",
  "🏆 Mi primer PR a un proyecto open source fue merged! Contribuí a la documentación de Next.js.",
  "📦 Monorepos con Turborepo: Cómo organicé 5 apps y 12 packages en un solo repositorio.",
  "🔧 Debugging avanzado: Chrome DevTools tiene features que el 90% de devs no conocen.",
  "🌍 Internacionalización (i18n) con next-intl: Soporte para 8 idiomas en mi app.",
  "💡 El mejor consejo que me dieron: 'Lee código de otros más de lo que escribes el tuyo'.",
]

const RESOURCE_URLS = [
  "https://react.dev/learn",
  "https://nextjs.org/docs",
  "https://www.typescriptlang.org/docs/handbook/",
  "https://prisma.io/docs",
  "https://tailwindcss.com/docs",
  "https://developer.mozilla.org/en-US/docs/Web",
  "https://github.com/vercel/next.js",
  "https://github.com/facebook/react",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=cuHDQhDhvPE",
  "https://dev.to/",
  "https://roadmap.sh",
  "https://leetcode.com",
  "https://github.com/donnemartin/system-design-primer",
  "https://www.patterns.dev",
  null,null,null,null,null, // Some posts without URLs
]

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  console.log("🌱 Starting massive seed (300 users)...")
  
  const hashedPassword = await bcrypt.hash("password123", 10)
  const allUserIds: string[] = []
  const seniorIds: string[] = []
  const juniorIds: string[] = []

  // Generate 300 unique users
  const usedEmails = new Set<string>()
  const usedNames = new Set<string>()

  const SENIOR_COUNT = 80
  const JUNIOR_COUNT = 220

  // ===== Create Seniors =====
  console.log(`👨‍💻 Creating ${SENIOR_COUNT} senior users...`)
  for (let i = 0; i < SENIOR_COUNT; i++) {
    let name = ""
    let email = ""
    
    do {
      const first = rand(FIRST_NAMES)
      const last = rand(LAST_NAMES)
      name = `${first} ${last}`
    } while (usedNames.has(name))
    usedNames.add(name)
    
    email = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, ".") + "@grocode.dev"
    if (usedEmails.has(email)) email = `${i}.${email}`
    usedEmails.add(email)

    const avatarSeed = name.replace(/\s/g, "")
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: hashedPassword,
        role: "SENIOR",
        image: `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarSeed}&backgroundColor=transparent`,
        bio: rand(BIOS_SENIOR),
        location: rand(LOCATIONS),
        website: Math.random() > 0.4 ? `https://github.com/${avatarSeed.toLowerCase()}` : null,
      }
    })
    seniorIds.push(user.id)
    allUserIds.push(user.id)
    
    if ((i + 1) % 20 === 0) console.log(`  ✓ ${i + 1}/${SENIOR_COUNT} seniors`)
  }

  // ===== Create Juniors =====
  console.log(`🎓 Creating ${JUNIOR_COUNT} junior users...`)
  for (let i = 0; i < JUNIOR_COUNT; i++) {
    let name = ""
    let email = ""
    
    do {
      const first = rand(FIRST_NAMES)
      const last = rand(LAST_NAMES)
      name = `${first} ${last}`
    } while (usedNames.has(name))
    usedNames.add(name)
    
    email = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, ".") + "@test.com"
    if (usedEmails.has(email)) email = `${i}.${email}`
    usedEmails.add(email)

    const avatarSeed = name.replace(/\s/g, "")
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: hashedPassword,
        role: "JUNIOR",
        image: `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarSeed}&backgroundColor=transparent`,
        bio: rand(BIOS_JUNIOR),
        location: rand(LOCATIONS),
        website: Math.random() > 0.7 ? `https://github.com/${avatarSeed.toLowerCase()}` : null,
      }
    })
    juniorIds.push(user.id)
    allUserIds.push(user.id)
    
    if ((i + 1) % 50 === 0) console.log(`  ✓ ${i + 1}/${JUNIOR_COUNT} juniors`)
  }

  // ===== Create Posts (600+) =====
  console.log("📝 Creating 600+ posts...")
  let postCount = 0

  // Seniors post 3-5 times each
  for (const sid of seniorIds) {
    const numPosts = randInt(3, 5)
    for (let p = 0; p < numPosts; p++) {
      const resourceUrl = rand(RESOURCE_URLS)
      const daysAgo = randInt(0, 90)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      await prisma.post.create({
        data: {
          content: rand(POST_CONTENTS),
          resourceUrl,
          authorId: sid,
          createdAt: date,
        }
      })
      postCount++
    }
  }

  // Juniors post 1-3 times each
  for (const jid of juniorIds) {
    const numPosts = randInt(1, 3)
    for (let p = 0; p < numPosts; p++) {
      const resourceUrl = rand(RESOURCE_URLS)
      const daysAgo = randInt(0, 90)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)

      await prisma.post.create({
        data: {
          content: rand(POST_CONTENTS),
          resourceUrl,
          authorId: jid,
          createdAt: date,
        }
      })
      postCount++
    }
  }
  console.log(`  ✓ ${postCount} posts created`)

  // ===== Create Follows (1500+) =====
  console.log("🤝 Creating follow relationships...")
  let followCount = 0
  const followPairs = new Set<string>()

  // Juniors follow seniors
  for (const jid of juniorIds) {
    const numFollows = randInt(3, 8)
    const targets = shuffleArray(seniorIds).slice(0, numFollows)
    for (const sid of targets) {
      const key = `${jid}-${sid}`
      if (followPairs.has(key) || jid === sid) continue
      followPairs.add(key)
      try {
        await prisma.follow.create({
          data: { followerId: jid, followingId: sid }
        })
        followCount++
      } catch {}
    }
  }

  // Some seniors follow other seniors
  for (const sid of seniorIds.slice(0, 30)) {
    const numFollows = randInt(2, 5)
    const targets = shuffleArray(seniorIds).filter(id => id !== sid).slice(0, numFollows)
    for (const tid of targets) {
      const key = `${sid}-${tid}`
      if (followPairs.has(key)) continue
      followPairs.add(key)
      try {
        await prisma.follow.create({
          data: { followerId: sid, followingId: tid }
        })
        followCount++
      } catch {}
    }
  }
  console.log(`  ✓ ${followCount} follows created`)

  // ===== Create Mentorship Requests (200+) =====
  console.log("🎯 Creating mentorship requests...")
  let mentorshipCount = 0
  const mentorshipPairs = new Set<string>()
  const statuses = ["PENDING", "ACCEPTED", "REJECTED"] as const

  for (const jid of shuffleArray(juniorIds).slice(0, 150)) {
    const numReqs = randInt(1, 3)
    const targets = shuffleArray(seniorIds).slice(0, numReqs)
    for (const sid of targets) {
      const key = `${jid}-${sid}`
      if (mentorshipPairs.has(key)) continue
      mentorshipPairs.add(key)
      try {
        await prisma.mentorshipRequest.create({
          data: {
            juniorId: jid,
            seniorId: sid,
            status: rand(statuses),
            message: Math.random() > 0.3 ? `Hola, me encantaría aprender de tu experiencia. Estoy enfocado en ${rand(TECHS)}.` : null,
          }
        })
        mentorshipCount++
      } catch {}
    }
  }
  console.log(`  ✓ ${mentorshipCount} mentorship requests created`)

  // ===== Summary =====
  console.log("\n✅ Seed complete!")
  console.log(`   👤 Users: ${allUserIds.length} (${seniorIds.length} seniors, ${juniorIds.length} juniors)`)
  console.log(`   📝 Posts: ${postCount}`)
  console.log(`   🤝 Follows: ${followCount}`)
  console.log(`   🎯 Mentorships: ${mentorshipCount}`)
  console.log(`\n   Login: any email / password123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
