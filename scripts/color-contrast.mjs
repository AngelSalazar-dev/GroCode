/**
 * Mide el contraste real de los colores de texto contra el fondo de cada tema.
 *
 * Uso: node scripts/color-contrast.mjs [puerto]
 *
 * Por que no basta con mirar el CSS: Tailwind v4 define los colores en oklch(),
 * y un `getComputedStyle` puede devolver `oklch(...)`. Este script pide al motor
 * de render el color ya resuelto (con un canvas, que normaliza cualquier espacio
 * de color a #rrggbb) y calcula el ratio con la formula de WCAG 2.x.
 *
 * Segunda pasada: para cada color que falla en tema claro, calcula cuanto hay
 * que oscurecerlo con `color-mix` hacia negro para alcanzar 4.5:1. Asi el valor
 * del fix sale de una medicion y no de una suposicion.
 */
import puppeteer from "puppeteer-core"

const PORT = process.argv[2] ?? "3980"
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const AA = 4.5

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})
const page = await browser.newPage()
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" })

const SHADES = [
  "amber-500", "amber-600", "amber-700",
  "emerald-500", "emerald-600", "emerald-700",
  "rose-500", "rose-600", "rose-700",
  "sky-500", "sky-600", "sky-700",
  "indigo-500", "indigo-600",
  "cyan-500", "cyan-600", "cyan-700",
  "violet-500", "violet-600", "violet-700",
  "yellow-500", "yellow-600", "yellow-700",
  "gray-500", "gray-600",
  "muted", "accent-gro",
]

const measured = await page.evaluate((shades) => {
  const probe = document.createElement("span")
  document.body.appendChild(probe)

  const cv = document.createElement("canvas")
  cv.width = cv.height = 1
  const ctx = cv.getContext("2d", { willReadFrequently: true })

  /** Normaliza lab()/oklch()/rgb() a [r,g,b] pasando por el canvas. */
  const toRgb = (value) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "#000000"
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  }

  const srgbToLinear = (v) => {
    v /= 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const luminance = ([r, g, b]) =>
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  const WHITE = [255, 255, 255]
  const DARK = [2, 2, 2]

  // Color de una clase inexistente: linea base para saber si la clase existe
  // de verdad en la hoja de estilos.
  probe.className = "text-clase-que-no-existe-grocode"
  const BASELINE = getComputedStyle(probe).color

  const MIXES = [90, 85, 80, 75, 70, 65, 60, 55, 50, 45]

  const out = []
  for (const name of shades) {
    probe.className = `text-${name}`
    const literal = getComputedStyle(probe).color
    if (literal === BASELINE) {
      out.push({ name, missing: true })
      continue
    }
    const base = toRgb(literal)
    const hex = "#" + base.map((v) => v.toString(16).padStart(2, "0")).join("")

    // Para cada porcentaje de mezcla, se mide el resultado real.
    const mixes = MIXES.map((pct) => ({
      pct,
      light: +ratio(toRgb(`color-mix(in oklab, ${literal} ${pct}%, black)`), WHITE).toFixed(2),
    }))

    out.push({
      name,
      hex,
      light: +ratio(base, WHITE).toFixed(2),
      dark: +ratio(base, DARK).toFixed(2),
      mixes,
    })
  }

  probe.remove()
  return out
}, SHADES)

await browser.close()

console.log(`\nContraste sobre blanco (tema claro) y sobre #020202 (tema oscuro)`)
console.log(`AA exige 4.5:1 para texto normal, 3:1 para texto grande (>=18.66px bold o >=24px)\n`)
console.log("color".padEnd(14), "hex".padEnd(9), "claro".padStart(6), "oscuro".padStart(7), "  veredicto")
console.log("-".repeat(64))

const fails = []
for (const r of measured) {
  if (r.missing) {
    console.log(r.name.padEnd(14), "no se usa en la app (Tailwind no la genero)")
    continue
  }
  const failLight = r.light < AA
  const failDark = r.dark < AA
  const verdict = failLight
    ? failDark
      ? "FALLA en ambos"
      : "FALLA en claro"
    : "ok"
  if (failLight) fails.push(r)
  console.log(
    r.name.padEnd(14),
    r.hex.padEnd(9),
    String(r.light).padStart(6),
    String(r.dark).padStart(7),
    "  " + verdict
  )
}

console.log(`\n${"=".repeat(64)}`)
console.log("Cuanto oscurecer cada color que falla en claro (color-mix hacia negro)")
console.log(`${"=".repeat(64)}\n`)

for (const r of fails) {
  const passing = r.mixes.filter((m) => m.light >= AA)
  // passing viene en orden descendente de porcentaje, asi que el primer
  // elemento que pasa es la mayor proporcion de color que aun cumple: el
  // oscurecimiento mas pequeno posible.
  const best = passing[0] ?? null
  console.log(
    `${r.name.padEnd(13)} base ${String(r.light).padStart(5)}:1  (en oscuro ${String(r.dark).padStart(5)}:1)`
  )
  if (best) {
    console.log(
      `  ${String(best.pct).padStart(2)}% del color + ${String(100 - best.pct).padStart(2)}% negro  ->  ${best.light}:1`
    )
  } else {
    console.log(`  ni al ${r.mixes.at(-1).pct}% llega a ${AA}:1`)
  }
  console.log(`  barrido: ${r.mixes.map((m) => `${m.pct}%:${m.light}`).join("  ")}\n`)
}
