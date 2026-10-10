/**
 * Comprueba que la tipografia que `layout.tsx` descarga (Geist + Geist Mono) es
 * la que el navegador aplica de verdad: antes `body` declaraba 'Inter', que
 * nunca se cargaba, y el sitio se renderizaba con la fuente del sistema mientras
 * los ficheros de Geist viajaban sin usarse.
 *
 * Uso: node scripts/probe-fonts.mjs [puerto]
 */
import puppeteer from "puppeteer-core"

const PORT = process.argv[2] ?? "3111"
const BASE = `http://localhost:${PORT}`
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

const page = await browser.newPage()
const fontRequests = []
page.on("request", (r) => {
  if (/fonts\.googleapis|fonts\.gstatic|\.woff2?/i.test(r.url())) fontRequests.push(r.url())
})
await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 60_000 })
await page.evaluate(() => document.fonts.ready)

const info = await page.evaluate(async () => {
  const body = getComputedStyle(document.body)
  const families = [...new Set([...document.fonts].map((f) => f.family))]

  const probe = document.createElement("span")
  probe.textContent = "GroCode 0123456789"
  probe.style.cssText = "position:absolute;visibility:hidden;font-size:64px"
  document.body.appendChild(probe)

  const widthOf = (family) => {
    probe.style.fontFamily = family
    return Math.round(probe.getBoundingClientRect().width)
  }

  // Force the face to download so the comparison below is against a loaded font.
  probe.style.fontFamily = "var(--font-geist-mono)"
  probe.textContent = "GroCode 0123456789"
  void probe.offsetWidth
  await document.fonts.load('64px "Geist Mono"')

  const widths = {
    body: widthOf(body.fontFamily),
    mono: widthOf("monospace"),
    geistMono: widthOf("var(--font-geist-mono)"),
  }
  probe.remove()

  return {
    bodyFontFamily: body.fontFamily,
    families,
    geistDeclared: families.some((f) => f === "Geist"),
    geistMonoDeclared: families.some((f) => f === "Geist Mono"),
    widths,
  }
})

const results = []
const check = (name, pass, detail = "") => {
  results.push(pass)
  console.log(`  ${pass ? "PASA" : "FALLA"}  ${name}${detail ? `  ${detail}` : ""}`)
}

console.log("\n[1] Tipografia aplicada")
check("body usa la pila de Geist", /Geist/.test(info.bodyFontFamily), info.bodyFontFamily)
check("body ya no declara Inter", !/Inter/.test(info.bodyFontFamily))
check("Geist esta declarada por next/font", info.geistDeclared, info.families.join(", "))
check("Geist Mono esta declarada por next/font", info.geistMonoDeclared)
check(
  "el cuerpo no cae en la monoespaciada del sistema",
  info.widths.body !== info.widths.mono,
  `${info.widths.body}px vs ${info.widths.mono}px`,
)
check(
  "--font-geist-mono resuelve a Geist Mono y no a monospace",
  info.widths.geistMono !== info.widths.mono,
  `${info.widths.geistMono}px vs ${info.widths.mono}px`,
)

console.log("\n[2] Peticiones de fuente")
check(
  "no se pide nada a Google Fonts",
  !fontRequests.some((u) => /fonts\.(googleapis|gstatic)/.test(u)),
  fontRequests.length ? `${fontRequests.length} woff2 locales` : "ninguna",
)

await browser.close()

const failed = results.includes(false)
console.log(`\n  Resultado: ${failed ? "FALLA" : "OK"}  (${results.filter(Boolean).length}/${results.length})`)
process.exit(failed ? 1 : 0)
