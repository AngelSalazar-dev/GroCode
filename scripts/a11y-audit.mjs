/**
 * Auditoría de accesibilidad de TODAS las rutas, incluidas las que requieren
 * sesión.
 *
 * La primera versión solo cubría rutas públicas: axe nunca vio /feed, /roadmap,
 * /notifications, /profile, /guardados ni /admin. Esos son precisamente los
 * sitios donde se acumulan los formularios, los modales y los botones de icono.
 *
 * El login se hace con el formulario real, no inyectando una cookie: asi se
 * audita tambien el formulario de entrada, que es parte de lo que hay que
 * revisar.
 *
 * Uso: node scripts/a11y-audit.mjs [puerto]
 * Requisitos: servidor levantado, y las deps de auditoria instaladas
 *   npm i --no-save axe-core puppeteer-core
 *
 * addScriptTag lee el fichero de disco, no lo pide al servidor, asi que axe
 * puede vivir en node_modules y hace falta copiarlo a public/ (donde lo
 * publicaria el deploy por 564 KB).
 *
 * Codigo de salida 1 si hay violaciones serias o criticas.
 */
import puppeteer from "puppeteer-core"
import { pathToFileURL } from "node:url"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const PORT = process.argv[2] ?? "3980"
const BASE = `http://localhost:${PORT}`
const ROOT = process.cwd()

// node_modules primero (no viaja al deploy); public/ como compatibilidad.
const AXE_CANDIDATES = [
  resolve(ROOT, "node_modules/axe-core/axe.min.js"),
  resolve(ROOT, "public/axe.min.js"),
]
const AXE_PATH = AXE_CANDIDATES.find((p) => existsSync(p))
if (!AXE_PATH) {
  console.error(
    "No encuentro axe.min.js. Instala las deps de auditoria: npm i --no-save axe-core puppeteer-core",
  )
  process.exit(1)
}
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const SEED_PASSWORD = "password123" // lo que genera prisma/seed.ts

const { PrismaClient } = await import(
  pathToFileURL(resolve(ROOT, "src/generated-v2/client/index.js")).href
)
const prisma = new PrismaClient()

// ------------------------------------------------- rutas desde la base de datos
// Los identificadores se leen de la BD para que el script no dependa de un
// email o un id escritos a mano.
const { junior, admin, post, profile } = await (async () => {
  const junior = await prisma.user.findFirst({
    where: { role: "JUNIOR", onboardingCompleted: true },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  })
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { email: true },
  })
  const post = await prisma.post.findFirst({ select: { id: true } })
  const profile = await prisma.user.findFirst({ select: { id: true } })
  return { junior, admin, post, profile }
})()

await prisma.$disconnect()

if (!junior || !post || !profile) {
  console.error(
    "\n  No hay datos de seed. Ejecuta `npx prisma db seed` antes de auditar.\n"
  )
  process.exit(2)
}

const ROUTES = [
  // sin sesion
  { path: "/", name: "home", auth: null },
  { path: "/auth/signin", name: "signin", auth: null },
  { path: "/auth/register", name: "register", auth: null },
  { path: "/mentors", name: "mentors", auth: null },
  { path: "/roadmap", name: "roadmap", auth: null },
  { path: "/guardados", name: "guardados (sin sesion)", auth: null },
  { path: "/no-existe-esta-pagina", name: "404", auth: null },

  // con sesion de JUNIOR
  { path: "/feed", name: "feed", auth: "junior" },
  { path: "/roadmap", name: "roadmap (con sesion)", auth: "junior" },
  { path: "/notifications", name: "notifications", auth: "junior" },
  { path: "/guardados", name: "guardados (con sesion)", auth: "junior" },
  { path: "/feed/new", name: "feed/new", auth: "junior" },
  { path: `/profile/${profile.id}`, name: "profile", auth: "junior" },
  { path: `/profile/${profile.id}/followers`, name: "profile/followers", auth: "junior" },
  { path: `/profile/${profile.id}/following`, name: "profile/following", auth: "junior" },
  { path: `/post/${post.id}`, name: "post", auth: "junior" },
  { path: "/apply-senior", name: "apply-senior", auth: "junior" },

  // con sesion de ADMIN
  { path: "/admin/applications", name: "admin/applications", auth: "admin" },
]

const EMAILS = { junior: junior.email, admin: admin?.email ?? junior.email }

// ------------------------------------------------------------------- helpers

/** Hace login con el formulario real y deja la cookie en el navegador. */
async function signIn(page, email) {
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2", timeout: 60000 })
  await page.type("#email", email)
  await page.type("#password", SEED_PASSWORD)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    page.click('form button[type="submit"], form button'),
  ])
  // Si el login falla, /api/auth/session no devuelve usuario.
  const session = await page.evaluate(async () => {
    const r = await fetch("/api/auth/session")
    return r.json()
  })
  if (!session?.user?.id) {
    throw new Error(`login fallido para ${email}`)
  }
  return session
}

const IMPACT = { critical: 4, serious: 3, moderate: 2, minor: 1 }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

// Un contexto de navegador por rol: la sesion vive en sus cookies, asi que se
// hace login una unica vez y se reutiliza en todas las rutas de ese rol.
// Las rutas publicas van a un contexto aparte, sin sesion.
const contexts = { anon: await browser.createBrowserContext() }
const loggedIn = {}

async function contextFor(auth) {
  const key = auth ?? "anon"
  if (!contexts[key]) {
    contexts[key] = await browser.createBrowserContext()
    const page = await contexts[key].newPage()
    // Se comprueba el login: si las credenciales del seed estuvieran mal, sin
    // esto cada ruta se mediria contra un redirect al login y "0 violaciones"
    // no significaria nada.
    loggedIn[key] = await signIn(page, EMAILS[key])
  }
  return contexts[key]
}

let worst = 0
const report = []

for (const theme of ["light", "dark"]) {
  for (const route of ROUTES) {
    const context = await contextFor(route.auth)
    const page = await context.newPage()
    await page.setViewport({ width: 390, height: 844 }) // movil: donde mas falla

    await page.goto(`${BASE}${route.path}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    })

    // Forzar el tema antes de medir: el contraste cambia por completo.
    await page.evaluate((t) => {
      localStorage.setItem("theme", t)
      document.documentElement.classList.toggle("dark", t === "dark")
      document.documentElement.style.colorScheme = t
    }, theme)
    await new Promise((r) => setTimeout(r, 400))

    // axe inyectado en el mundo principal. addScriptTag lee el fichero local y lo
    // inserta como script en linea, que la CSP si permite ('unsafe-inline').
    await page.addScriptTag({ path: AXE_PATH })
    const axeReady = await page.evaluate(() => typeof window.axe !== "undefined")
    if (!axeReady) throw new Error(`axe no quedo definido en ${route.path}`)

    const result = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      })
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => ({
          target: n.target.join(" "),
          summary: (n.failureSummary ?? "")
            .split("\n")
            .filter(Boolean)
            .slice(1, 3)
            .join(" | "),
        })),
        total: v.nodes.length,
      }))
    })

    const blocking = result.filter((v) => IMPACT[v.impact] >= IMPACT.serious)
    for (const v of blocking) worst = Math.max(worst, IMPACT[v.impact])

    report.push({ theme, route: route.name, path: route.path, auth: route.auth, violations: result })
    await page.close()
  }
}

await browser.close()

let printed = 0
for (const entry of report) {
  const blocking = entry.violations.filter((v) => IMPACT[v.impact] >= IMPACT.serious)
  if (blocking.length === 0) continue
  printed++
  console.log(`\n[${entry.theme}] ${entry.route}  ${entry.path}  (sesion: ${entry.auth ?? "ninguna"})`)
  for (const v of blocking) {
    console.log(`  ${v.impact.toUpperCase().padEnd(8)} ${v.id}  (${v.total} nodos)  ${v.help}`)
    for (const n of v.nodes) {
      console.log(`             ${n.target}`)
      if (n.summary) console.log(`             ${n.summary}`)
    }
  }
}

const totalAll = report.reduce((a, e) => a + e.violations.length, 0)
const totalBlocking = report.reduce(
  (a, e) => a + e.violations.filter((v) => IMPACT[v.impact] >= IMPACT.serious).length,
  0
)
const withSession = report.filter((e) => e.auth).length

console.log(`\n${"-".repeat(66)}`)
console.log(`Combinaciones auditadas : ${report.length} (${ROUTES.length} rutas x 2 temas)`)
console.log(`  de ellas con sesion   : ${withSession}`)
console.log(`Violaciones totales     : ${totalAll}`)
console.log(`Serias o criticas       : ${totalBlocking}`)
if (totalBlocking === 0) {
  console.log(`\nOK: sin violaciones serias ni criticas.`)
} else {
  console.log(`\nFALLO: ${totalBlocking} violaciones serias/criticas en ${printed} combinaciones.`)
}

process.exit(totalBlocking === 0 ? 0 : 1)