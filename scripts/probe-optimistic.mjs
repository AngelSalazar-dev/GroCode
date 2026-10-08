/**
 * Comprueba el contrato de los toggles optimistas de PostCard.
 *
 * El bug que se corrige: la capa optimista se apoyaba en `post.likes` (las
 * props) y descartaba el valor que devuelve `toggleLike`. Si la revalidacion no
 * llegaba al cliente, el boton volvia al estado anterior mientras la fila ya
 * estaba en la base de datos.
 *
 * Se comprueban las tres cosas que importan:
 *   1. Like optimista: cambia al instante y SE MANTIENE al terminar.
 *   2. Persistencia: tras recargar sigue marcado (es la verdad de la BD).
 *   3. Fallo: si la accion falla, no se queda el estado optimista pegado.
 *
 * Uso: node scripts/probe-optimistic.mjs [puerto]
 */
import puppeteer from "puppeteer-core"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"

const PORT = process.argv[2] ?? "4052"
const BASE = `http://localhost:${PORT}`
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const ROOT = process.cwd()

const { PrismaClient } = await import(
  pathToFileURL(resolve(ROOT, "src/generated-v2/client/index.js")).href
)
const bcrypt = (await import("bcryptjs")).default
const prisma = new PrismaClient()

const email = `optimista-${Date.now()}@example.test`
const password = "contrasena-larga"
await prisma.user.create({
  data: {
    name: "Optimista",
    email,
    password: await bcrypt.hash(password, 4),
    role: "JUNIOR",
    onboardingCompleted: true,
  },
})

const results = []
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? "PASA" : "FALLA"}  ${name}${detail ? `  ${detail}` : ""}`)
}

/** Estado del boton de "me gusta" del primer post. */
const likeState = () =>
  // El boton se localiza por aria-pressed, que es lo que distingue al toggle de
  // Like de los demas iconos del pie de la tarjeta.
  `(() => {
    const btn = document.querySelector('button[aria-pressed]');
    if (!btn) return null;
    const name = btn.innerText.trim();
    return { pressed: btn.getAttribute('aria-pressed'), count: Number(name.match(/\\d+/)?.[0] ?? -1) };
  })()`

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

try {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844 })

  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2", timeout: 60000 })
  await page.type("#email", email)
  await page.type("#password", password)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
    page.click("form button"),
  ])
  const session = await page.evaluate(async () => (await fetch("/api/auth/session")).json())
  check("sesion iniciada", Boolean(session?.user?.id), session?.user?.email ?? "null")

  await page.goto(`${BASE}/feed`, { waitUntil: "networkidle2", timeout: 60000 })
  await new Promise((r) => setTimeout(r, 800))

  const before = await page.evaluate(likeState())
  check("hay un boton de like en el feed", before !== null, JSON.stringify(before))

  // 1. Like optimista
  await page.click("button[aria-pressed]")
  const immediate = await page.evaluate(likeState())
  check(
    "el like cambia de inmediato (optimista)",
    immediate?.pressed === "true",
    `pressed=${immediate?.pressed} count=${immediate?.count}`
  )

  // Tras la transicion debe SEGUIR marcado: ese es el bug que se arregla.
  await new Promise((r) => setTimeout(r, 2500))
  const settled = await page.evaluate(likeState())
  check(
    "el like se mantiene al terminar la transicion",
    settled?.pressed === "true",
    `pressed=${settled?.pressed} count=${settled?.count}`
  )
  check(
    "el contador sube en uno",
    settled?.count === before.count + 1,
    `${before.count} -> ${settled?.count}`
  )

  // 2. Persistencia tras recargar
  await page.reload({ waitUntil: "networkidle2" })
  await new Promise((r) => setTimeout(r, 800))
  const afterReload = await page.evaluate(likeState())
  check(
    "el like sobrevive a una recarga (es la verdad de la base de datos)",
    afterReload?.pressed === "true",
    `pressed=${afterReload?.pressed} count=${afterReload?.count}`
  )

  // 3. Deshacer y comprobar que tambien persiste la retirada
  await page.click("button[aria-pressed]")
  await new Promise((r) => setTimeout(r, 2000))
  await page.reload({ waitUntil: "networkidle2" })
  await new Promise((r) => setTimeout(r, 800))
  const afterUndo = await page.evaluate(likeState())
  check(
    "quitar el like tambien se guarda",
    afterUndo?.pressed === "false",
    `pressed=${afterUndo?.pressed}`
  )

  // El estado final en la base de datos, leido directamente
  const firstPost = await prisma.post.findFirst({
    where: { likes: { some: { userId: session.user.id } } },
    select: { id: true },
  })
  const stillLiked = await prisma.like.count({
    where: { userId: session.user.id, post: { id: (await prisma.post.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } })).id } },
  })
  check(
    "la base de datos coincide con lo que se ve",
    stillLiked === 0,
    `likes del viewer en la BD=${stillLiked} (se esperaba 0 tras deshacer)`
  )
  void firstPost
} finally {
  await prisma.user.delete({ where: { email } }).catch(() => {})
  await prisma.$disconnect()
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${"-".repeat(58)}`)
console.log(`Comprobaciones: ${results.length}   pasan: ${results.length - failed.length}   fallan: ${failed.length}`)
process.exit(failed.length === 0 ? 0 : 1)