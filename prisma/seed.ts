import { PrismaClient, ApplicationStatus } from "../src/generated-v2/client"
import bcrypt from "bcryptjs"
import { randomBytes } from "node:crypto"

const prisma = new PrismaClient()

// Mirrors src/lib/channels.ts. Duplicated because the seed runs outside the
// TypeScript path aliases; keep both in sync.
const CHANNEL_IDS = [
  "general",
  "javascript",
  "typescript",
  "python",
  "react",
  "nextjs",
  "backend",
  "devops",
  "ai-ml",
  "career",
  "showoff",
]

const COMMENTS = [
  "Gracias por compartir esto, justo lo que necesitaba.",
  "¿En qué versión de React lo probaste?",
  "Muy buen explicación, muy claro todo el proceso.",
  "Lo probé y me funcionó, muchas gracias.",
  "¿Tienes algún enlace a documentación más a fondo?",
  "Este enfoque me ahorró horas de trabajo, gracias.",
  "Interesante, no lo había pensado así.",
  "Funciona perfecto en producción, lo confirmo.",
]

const MOTIVATIONS = [
  "Llevo más de cinco años en el frontend y me gustaría acompañar a juniors que están dando sus primeros pasos. Me gusta explicar los porqués detrás de cada decisión, no solo el cómo.",
  "Quiero compartir lo que aprendí cometiendo errores en proyectos reales. Empezar de cero fue duro y me gustaría que nadie tenga que pasar por lo mismo.",
  "Me apasiona la mentoría. Ver a alguien entender un concepto por primera vez es una de las cosas que más satisfacción me dan en el trabajo.",
  "En mi equipo cuesta encontrar a quien pueda dedicar tiempo real al mentoring, así que quiero devolver parte de lo que aprendí.",
  "Creo que el mentoring es la forma más rápida de crecer: obligarse a explicar en voz alta ordena el propio pensamiento. Me gustaría acompañar a otros en eso.",
]

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
  "Ingeniero senior enfocado en performance web y experiencias de usuario de clase mundial.",
  "DevOps Engineer con experiencia en AWS, GCP y Kubernetes. Construyo pipelines que escalan.",
  "Full-stack developer con foco en TypeScript y Next.js. Mentor de más de 50 desarrolladores.",
  "Especialista en IA/ML con Python y TensorFlow. He publicado papers en NeurIPS y ICML.",
  "CTO de una fintech en crecimiento. Amo enseñar arquitectura limpia y patrones de diseño.",
  "Backend engineer. Rust, Go y PostgreSQL son mi stack principal. Contribuyo a proyectos open source.",
  "Mobile developer con 8 años en React Native y Flutter. He publicado apps con millones de usuarios.",
  "Ingeniera de datos. ETL pipelines, Spark y data lakes son mi día a día.",
  "Security researcher y pentester certificado. OWASP Top 10 es mi biblia.",
  "Platform engineer construyendo herramientas para developers, con experiencia en pagos y redes sociales.",
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

function rand<T>(arr: readonly T[]): T {
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

/**
 * Inserta por lotes contra la base de datos.
 *
 * Contra TiDB cada INSERT individual cuesta ~325 ms de ida y vuelta de red. El
 * seed hace miles, y a fila a fila tardaba mas de 15 minutos y se caia a mitad
 * de la fase de follows. `createMany` agrupa las filas en una sola ida y vuelta.
 *
 * Va en trozos de CHUNK para no generar un INSERT tan grande que agote el limite
 * de packet de MySQL. Si un trozo falla, se reintenta fila a fila: un duplicado
 * no debe tirar abajo un lote entero.
 */
const CHUNK = 250

type BatchedDelegate = {
  createMany: (args: { data: unknown[]; skipDuplicates?: boolean }) => Promise<{ count: number }>
  create: (args: { data: unknown }) => Promise<unknown>
}

async function insertInChunks(
  model: unknown,
  rows: unknown[],
  { skipDuplicates = false }: { skipDuplicates?: boolean } = {}
): Promise<number> {
  if (rows.length === 0) return 0

  // Prisma tipa cada delegate con sus propios genericos, incompatibles entre
  // si, asi que aqui se estrecha al contrato minimo que really usa el seed.
  const delegate = model as BatchedDelegate
  let inserted = 0

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    try {
      const res = await delegate.createMany({ data: chunk, skipDuplicates })
      inserted += res.count
    } catch {
      for (const row of chunk) {
        try {
          await delegate.create({ data: row })
          inserted++
        } catch {}
      }
    }
  }
  return inserted
}

async function main() {
  // This script truncates every table and creates 300 accounts. Running it
  // against production would wipe real data and, before this guard, give every
  // seeded account the same known password.
  if (process.env.NODE_ENV === "production") {
    throw new Error("prisma/seed.ts refuses to run with NODE_ENV=production")
  }
  if (/prod/i.test(process.env.DATABASE_URL ?? "")) {
    throw new Error(
      "prisma/seed.ts refuses to run against a DATABASE_URL that contains 'prod'"
    )
  }

  // NODE_ENV is usually undefined when this runs by hand, so also refuse any
  // non-local host unless the operator opts in explicitly. A Supabase dev
  // database needs SEED_ALLOW_REMOTE=1; a production one should never get it.
  let dbHost = ""
  try {
    dbHost = new URL(process.env.DATABASE_URL ?? "").hostname
  } catch {
    dbHost = ""
  }
  const isLocalHost =
    dbHost === "" || dbHost === "localhost" || dbHost === "127.0.0.1" || dbHost === "::1"
  if (!isLocalHost && process.env.SEED_ALLOW_REMOTE !== "1") {
    throw new Error(
      `prisma/seed.ts refuses to seed the non-local database "${dbHost}". ` +
        "Set SEED_ALLOW_REMOTE=1 only if you are sure it is disposable."
    )
  }

  console.log("🌱 Starting massive seed (300 users)...")

  // El seed tiene que poder relanzarse. Antes los usuarios usaban upsert pero
  // posts, follows, likes, comentarios, postulaciones y notificaciones se
  // creaban con create a secas: una segunda pasada duplicaba cientos de filas
  // y las metricas del feed quedaban falseadas. Truncar al principio hace que el
  // resultado sea siempre el mismo.
  console.log('  Truncando tablas...')
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.bookmark.deleteMany(),
    prisma.like.deleteMany(),
    prisma.mentorshipRequest.deleteMany(),
    prisma.seniorApplication.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.post.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ])
  // SEED_PASSWORD is a development convenience: set it when you need to log in
  // as the seeded accounts. Without it, each user gets its own random password,
  // so a leaked seed cannot be used to log in anywhere.
  const sharedSeedPassword = process.env.SEED_PASSWORD
  const sharedHash = sharedSeedPassword
    ? await bcrypt.hash(sharedSeedPassword, 10)
    : null
  const newPasswordHash = () =>
    sharedHash ?? bcrypt.hash(randomBytes(12).toString("base64url"), 10)

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
        password: await newPasswordHash(),
        role: "SENIOR",
        onboardingCompleted: true,
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
        password: await newPasswordHash(),
        role: "JUNIOR",
        onboardingCompleted: true,
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
  console.log("→ Creating 600+ posts...")

  const postRows: {
    content: string
    resourceUrl: string | null
    channel: string
    authorId: string
    createdAt: Date
  }[] = []

  // Seniors post 3-5 times each
  for (const sid of seniorIds) {
    const numPosts = randInt(3, 5)
    for (let p = 0; p < numPosts; p++) {
      const date = new Date()
      date.setDate(date.getDate() - randInt(0, 90))
      postRows.push({
        content: rand(POST_CONTENTS),
        resourceUrl: rand(RESOURCE_URLS),
        // Without this every post fell into `general`, leaving 10 of the 11
        // channels permanently empty.
        channel: rand(CHANNEL_IDS),
        authorId: sid,
        createdAt: date,
      })
    }
  }

  // Juniors post 1-3 times each
  for (const jid of juniorIds) {
    const numPosts = randInt(1, 3)
    for (let p = 0; p < numPosts; p++) {
      const date = new Date()
      date.setDate(date.getDate() - randInt(0, 90))
      postRows.push({
        content: rand(POST_CONTENTS),
        resourceUrl: rand(RESOURCE_URLS),
        channel: rand(CHANNEL_IDS),
        authorId: jid,
        createdAt: date,
      })
    }
  }

  // createMany no devuelve los ids, asi que despues se recuperan con una
  // consulta: las fases de likes y comentarios los necesitan.
  const postCount = await insertInChunks(prisma.post, postRows)
  console.log(`  ✓ ${postCount} posts created across ${CHANNEL_IDS.length} channels`)

  // ===== Create Follows (1500+) =====
  // Insertar fila a fila contra TiDB cuesta ~325 ms por INSERT (ida y vuelta de
  // red). Con 1200 follows eso son mas de seis minutos solo en esta fase, y el
  // seed se caia antes de terminar. `createMany` envia un unico INSERT de
  // varias filas: la misma cantidad de datos, una fraccion del tiempo.
  console.log("→ Creating follow relationships...")
  let followCount = 0
  const followPairs = new Set<string>()
  const followRows: { followerId: string; followingId: string }[] = []

  // Juniors follow seniors
  for (const jid of juniorIds) {
    const numFollows = randInt(3, 8)
    const targets = shuffleArray(seniorIds).slice(0, numFollows)
    for (const sid of targets) {
      const key = `${jid}-${sid}`
      if (followPairs.has(key) || jid === sid) continue
      followPairs.add(key)
      followRows.push({ followerId: jid, followingId: sid })
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
      followRows.push({ followerId: sid, followingId: tid })
    }
  }

  followCount = await insertInChunks(prisma.follow, followRows, { skipDuplicates: true })
  console.log(`  ✓ ${followCount} follows created`)

  // ===== Create Mentorship Requests (200+) =====
  console.log("→ Creating mentorship requests...")
  const mentorshipPairs = new Set<string>()
  const statuses = ["PENDING", "ACCEPTED", "REJECTED"] as const
  const mentorshipRows: {
    juniorId: string
    seniorId: string
    status: (typeof statuses)[number]
    message: string | null
  }[] = []

  for (const jid of shuffleArray(juniorIds).slice(0, 150)) {
    const numReqs = randInt(1, 3)
    const targets = shuffleArray(seniorIds).slice(0, numReqs)
    for (const sid of targets) {
      const key = `${jid}-${sid}`
      if (mentorshipPairs.has(key)) continue
      mentorshipPairs.add(key)
      mentorshipRows.push({
        juniorId: jid,
        seniorId: sid,
        status: rand(statuses),
        message: Math.random() > 0.3 ? `Hola, me gustaría aprender de tu experiencia. Estoy enfocado en ${rand(TECHS)}.` : null,
      })
    }
  }

  const mentorshipCount = await insertInChunks(prisma.mentorshipRequest, mentorshipRows)
  console.log(`  ✓ ${mentorshipCount} mentorship requests created`)

  // ===== Interactions: likes, bookmarks, comments =====
  // Without these every counter read 0 and no post had a comment, which made
  // the whole app look broken in a fresh dev environment.
  console.log("→ Creating likes, bookmarks and comments...")
  const allPosts = await prisma.post.findMany({ select: { id: true, authorId: true } })
  const voters = shuffleArray(allUserIds)

  const likeRows: { userId: string; postId: string }[] = []
  const bookmarkRows: { userId: string; postId: string }[] = []
  const commentRows: { userId: string; postId: string; content: string; createdAt: Date }[] = []

  for (const post of allPosts) {
    const numLikes = randInt(0, 14)
    // Never let a post be liked by its own author.
    const likers = shuffleArray(voters.filter((id) => id !== post.authorId)).slice(0, numLikes)

    for (const uid of likers) {
      likeRows.push({ userId: uid, postId: post.id })
    }

    for (const uid of shuffleArray(likers).slice(0, randInt(0, 3))) {
      bookmarkRows.push({ userId: uid, postId: post.id })
    }

    const numComments = randInt(0, 3)
    for (let i = 0; i < numComments; i++) {
      const uid = rand(voters)
      if (uid === post.authorId) continue
      const date = new Date()
      date.setDate(date.getDate() - randInt(0, 30))
      commentRows.push({ userId: uid, postId: post.id, content: rand(COMMENTS), createdAt: date })
    }
  }

  const likeCount = await insertInChunks(prisma.like, likeRows, { skipDuplicates: true })
  await insertInChunks(prisma.bookmark, bookmarkRows, { skipDuplicates: true })
  const commentCount = await insertInChunks(prisma.comment, commentRows)
  console.log(`  ✓ ${likeCount} likes, ${commentCount} comments created`)

  // ===== Senior applications + notifications =====
  // The admin panel had nothing to review and every user saw
  // "Sin notificaciones" forever.
  console.log("→ Creating senior applications and notifications...")
  const APPLICATION_STATUSES: ApplicationStatus[] = [
    ApplicationStatus.PENDING,
    ApplicationStatus.VERIFIED,
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
  ]

  // Cada usuario postula como maximo una vez, asi que se eligen sin repetir.
  const applicants = shuffleArray(juniorIds).slice(0, 25)
  const applicationRows = applicants.map((jid, i) => ({
    userId: jid,
    yearsOfExperience: rand(["3-5", "5-8", "8-12", "12+"]),
    technologies: rand(TECHS),
    githubProfile: `https://github.com/user${i}`,
    linkedinProfile: Math.random() > 0.5 ? `https://www.linkedin.com/in/user${i}` : null,
    motivation: rand(MOTIVATIONS),
    status: rand(APPLICATION_STATUSES),
  }))
  const applicationCount = await insertInChunks(prisma.seniorApplication, applicationRows)

  // Give the first admin something to review.
  const admin = await prisma.user.findFirst({
    where: { email: { endsWith: "@grocode.dev" } },
    select: { id: true },
  })
  if (admin) {
    await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } })
    console.log(`  ✓ admin created: ${admin.id}`)
  }

  const NOTIFICATION_SEEDS = [
    { type: "like", content: "Alguien marcó con estrella tu publicación." },
    { type: "comment", content: "Alguien comentó tu publicación." },
    { type: "follow", content: "Alguien empezó a seguirte." },
    { type: "mentorship", content: "Tienes una solicitud de mentoría por revisar." },
    { type: "announcement", content: "Bienvenido a la comunidad de GroCode." },
  ]

  const notificationRows: {
    userId: string
    type: string
    content: string
    read: boolean
    createdAt: Date
  }[] = []
  for (const uid of allUserIds.slice(0, 40)) {
    for (const seed of shuffleArray(NOTIFICATION_SEEDS).slice(0, randInt(1, 4))) {
      const date = new Date()
      date.setDate(date.getDate() - randInt(0, 14))
      notificationRows.push({
        userId: uid,
        type: seed.type,
        content: seed.content,
        read: Math.random() > 0.6,
        createdAt: date,
      })
    }
  }
  const notificationCount = await insertInChunks(prisma.notification, notificationRows)
  console.log(`  ✓ ${applicationCount} applications, ${notificationCount} notifications created`)

  // ===== Roadmap =====
  const roadmapSteps = await prisma.roadmapStep.count()
  if (roadmapSteps === 0) {
    console.log("  ⚠ No roadmap steps. Run: npx tsx prisma/seed-roadmap.ts")
  }

  // ===== Summary =====
  console.log("\n✅ Seed complete!")
  console.log(`   👤 Users: ${allUserIds.length} (${seniorIds.length} seniors, ${juniorIds.length} juniors)`)
  console.log(`   📝 Posts: ${postCount} across ${CHANNEL_IDS.length} channels`)
  console.log(`   🤝 Follows: ${followCount}`)
  console.log(`   🎯 Mentorships: ${mentorshipCount}`)
  console.log(`   ❤️ Likes: ${likeCount}`)
  console.log(`   💬 Comments: ${commentCount}`)
  console.log(`   📬 Applications: ${applicationCount}`)
  console.log(`   🔔 Notifications: ${notificationCount}`)
  if (sharedSeedPassword) {
    console.log(`\n   Login: any seeded email / ${sharedSeedPassword}`)
  } else {
    console.log(
      "\n   Seeded accounts have random passwords. Set SEED_PASSWORD to log in as them."
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })