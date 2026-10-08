/**
 * Captura la misma pantalla en tema claro y en tema oscuro para poder
 * comprobar a ojo que el arreglo de contraste no rompio el disenio.
 *
 * Uso: node scripts/a11y-screenshots.mjs [puerto] [directorio]
 */
import puppeteer from "puppeteer-core"
import { mkdir } from "node:fs/promises"

const PORT = process.argv[2] ?? "3980"
const OUT = process.argv[3] ?? ".next/a11y-shots"
const BASE = `http://localhost:${PORT}`
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

const PAGES = [
  { path: "/", name: "home" },
  { path: "/mentors", name: "mentors" },
  { path: "/roadmap", name: "roadmap" },
  { path: "/auth/signin", name: "signin" },
  { path: "/auth/register", name: "register" },
]

await mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

for (const theme of ["light", "dark"]) {
  for (const p of PAGES) {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
    await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle2", timeout: 60000 })
    await page.evaluate((t) => {
      localStorage.setItem("theme", t)
      document.documentElement.classList.toggle("dark", t === "dark")
      document.documentElement.style.colorScheme = t
    }, theme)
    await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: `${OUT}/${p.name}-${theme}.png` })
    await page.close()
    console.log(`  ${p.name}-${theme}.png`)
  }
}

await browser.close()
console.log(`\nCapturas en ${OUT}`)
