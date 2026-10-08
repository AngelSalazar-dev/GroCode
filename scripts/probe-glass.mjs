/**
 * Mide el fondo y el desenfoque reales del boton "Explorar Mentores" del hero,
 * en los dos temas.
 *
 * Existe porque `.glass` usaba `rgba(var(--card), 0.7)`, y `rgba()` no admite un
 * hexadecimal: el navegador descartaba el shorthand y el boton salia totalmente
 * transparente y sin `backdrop-filter`. El sintoma no se ve leyendo el CSS, hay
 * que mirarlo en el navegador.
 *
 * Uso: node scripts/probe-glass.mjs [puerto]
 */
import puppeteer from "puppeteer-core"

const PORT = process.argv[2] ?? "4051"
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

for (const theme of ["light", "dark"]) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle2", timeout: 60000 })
  await page.evaluate((t) => {
    localStorage.setItem("theme", t)
    document.documentElement.classList.toggle("dark", t === "dark")
    document.documentElement.style.colorScheme = t
  }, theme)
  await new Promise((r) => setTimeout(r, 400))

  const r = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("a")].find((a) =>
      a.textContent.includes("Explorar Mentores")
    )
    if (!btn) return { error: "boton no encontrado" }
    const cs = getComputedStyle(btn)

    let rule = null
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      for (const x of rules) {
        if (x.selectorText === ".glass") {
          rule = {
            background: x.style.background,
            backdropFilter: x.style.backdropFilter,
          }
        }
      }
    }

    // Ojo: `"none"` es truthy, asi que `cs.backdropFilter || cs.webkitBackdropFilter`
    // NUNCA cae al valor con prefijo cuando el sin prefijo vale "none". Hay que
    // mirar los dos por separado: es exactamente el fallo que hizo que este
    // script diera un FALLO falso.
    const blurUnprefixed = cs.backdropFilter
    const blurWebkit = cs.webkitBackdropFilter

    return {
      card: getComputedStyle(document.documentElement).getPropertyValue("--card").trim(),
      regla: rule,
      fondo: cs.backgroundColor,
      blurSinPrefijo: blurUnprefixed,
      blurConPrefijo: blurWebkit,
      borde: cs.borderTopColor,
    }
  })

  console.log(`\n[${theme}]`)
  for (const [k, v] of Object.entries(r)) console.log(`  ${k.padEnd(16)} ${JSON.stringify(v)}`)

  // El bug original era un fondo transparente. El desenfoque vale si lo resuelve
  // cualquiera de las dos formas (con o sin prefijo).
  //
  // Importante: `undefined !== "none"` es `true`, asi que comparar contra
  // "undefined" daria un OK falso. Un valor ausente no es un desenfoque aplicado.
  const transparent = r.fondo === "rgba(0, 0, 0, 0)"
  const blur =
    typeof r.blurSinPrefijo === "string" && r.blurSinPrefijo !== "none"
      ? r.blurSinPrefijo
      : typeof r.blurConPrefijo === "string" && r.blurConPrefijo !== "none"
        ? r.blurConPrefijo
        : null
  if (transparent || !blur) {
    console.log(
      `  FALLO   ${transparent ? "sin fondo translucido" : ""}${transparent && !blur ? " y " : ""}${!blur ? `sin backdrop-filter (sinPrefijo=${r.blurSinPrefijo}, conPrefijo=${r.blurConPrefijo})` : ""}`
    )
  } else {
    console.log(`  OK      fondo translucido (${r.fondo}) y desenfoque ${blur}`)
  }
  await page.close()
}

await browser.close()