/**
 * Busca el caso en el que la capa optimista de PostCard se contradice con la
 * base de datos.
 *
 * `toggleLike` revalida `/feed` y `/profile/{autor}`, pero NO `/guardados` ni
 * `/post/{id}`. En esas paginas las props pueden quedarse obsoletas al terminar
 * la transicion, que es justo cuando la capa optimista revierte.
 *
 * Uso: node scripts/probe-optimistic-routes.mjs [puerto]
 */
import puppeteer from "puppeteer-core"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"

const PORT = process.argv[2] ?? "4054"
const BASE = `http://localhost:${PORT}`
const ROOT = process.cwd()

const { PrismaClient } = await import(
  pathToFileURL(resolve(ROOT, "src/generated-v2/client/index.js")).href
)
const bcrypt = (await import("bcryptjs")).default
const prisma = new PrismaClient()

const email = `rutas-${Date.now()}@example.test`
const password = "contrasena-larga"
await prisma.user.create({
  data: {
    name: "Rutas",
    email,
    password: await bcrypt.hash(password, 4),
    role: "JUNIOR",
    onboardingCompleted: true,
  },
})

// Un post cualquiera con contenido identificable
const anyPost = await prisma.post.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } })
if (!anyPost) {
  console.error("  no hay posts; ejecuta el seed")
  process.exit(2)
}

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

const likeState = () =>
  `(() => {
    const btn = document.querySelector('button[aria-pressed]');
    if (!btn) return null;
    return { pressed: btn.getAttribute('aria-pressed'), count: Number(btn.innerText.trim().match(/\\d+/)?.[0] ?? -1) };
  })()`

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

  for (const route of ["/feed", "/guardados", `/post/${anyPost.id}`]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 60000 })
    await new Promise((r) => setTimeout(r, 900))

    const before = await page.evaluate(likeState())
    if (!before) {
      console.log(`\n${route}: sin boton de like (no aplica)`)
      continue
    }
    if (before.pressed === "true") {
      // Dejar el post sin like para partir de un estado conocido
      await page.click("button[aria-pressed]")
      await new Promise((r) => setTimeout(r, 2000))
      await page.reload({ waitUntil: "networkidle2" })
      await new Promise((r) => setTimeout(r, 900))
    }

    await page.click("button[aria-pressed]")
    const inmediato = await page.evaluate(likeState())
    await new Promise((r) => setTimeout(r, 3000))
    const asentado = await page.evaluate(likeState())

    // La verdad: la base de datos
    const enBd = await prisma.like.count({
      where: { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } })).id },
    })

    const contradiccion = enBd > 0 && asentado?.pressed !== "true"
    console.log(`\n${route}`)
    console.log(`  optimista inmediato : ${inmediato?.pressed} (${inmediato?.count})`)
    console.log(`  tras la transicion : ${asentado?.pressed} (${asentado?.count})`)
    console.log(`  base de datos      : ${enBd} like(s)`)
    console.log(
      contradiccion
        ? `  CONTRADICCION: la BD tiene el like y la pantalla dice que no`
        : `  coherente`
    )

    // Limpiar para la siguiente ruta
    if (enBd > 0) {
      await prisma.like.deleteMany({
        where: { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } })).id },
      })
    }
  }
} finally {
  await prisma.user.delete({ where: { email } }).catch(() => {})
  await prisma.$disconnect()
  await browser.close()
}