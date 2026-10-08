/**
 * Verifica en un navegador real las conductas de accesibilidad que un linter
 * no puede comprobar: tamaño de los targets tactiles, cierre con Escape del
 * desplegable, pausa del video con prefers-reduced-motion, y association de
 * labels con sus controles.
 *
 * Uso: node scripts/a11y-behaviours.mjs [puerto]
 * Salida: codigo de salida 1 si algun comportamiento falla.
 */
import puppeteer from "puppeteer-core"

const PORT = process.argv[2] ?? "3980"
const BASE = `http://localhost:${PORT}`
const CHROME =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

const MIN_TARGET = 44
const results = []
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? "PASA" : "FALLA"}  ${name}${detail ? `  ${detail}` : ""}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})

// ---------------------------------------------------------------- targets
{
  console.log("\n[1] Targets tactiles >= 44px (movil 390x844)")
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true })
  for (const path of ["/", "/mentors", "/auth/signin", "/roadmap"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2", timeout: 60000 })
    const small = await page.evaluate((min) => {
      const sel = "button, a[href], [role='button'], input[type='checkbox']"
      const out = []
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue // oculto
        // El enlace "saltar al contenido" es sr-only a proposito: mide 1x1 hasta
        // recibir el foco, momento en el que se hace visible. Es el patron
        // correcto, no un target pequeno.
        if (el.classList.contains("sr-only")) continue
        // Un enlace dentro de un texto corrido no es un target tactil propio.
        const inline = el.tagName === "A" && getComputedStyle(el).display === "inline"
        if (inline) continue
        if (r.width < min || r.height < min) {
          out.push({
            tag: el.tagName.toLowerCase(),
            label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          })
        }
      }
      return out
    }, MIN_TARGET)
    check(
      `${path} sin targets por debajo de ${MIN_TARGET}px`,
      small.length === 0,
      small.length === 0
        ? ""
        : small.map((s) => `${s.tag}"${s.label}" ${s.w}x${s.h}`).join("  ")
    )
  }
  await page.close()
}

// ------------------------------------------------- desplegable de orden
{
  console.log("\n[2] Desplegable de orden: aria-expanded, menu y Escape")
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${BASE}/mentors`, { waitUntil: "networkidle2", timeout: 60000 })

  const trigger = await page.evaluateHandle(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.hasAttribute("aria-controls") && b.getAttribute("aria-controls") === "mentor-sort-menu"
    )
    if (btn) btn.click()
    return btn ?? null
  })
  await new Promise((r) => setTimeout(r, 500))

  const expanded = await page.evaluate(
    () => document.querySelector('[aria-controls="mentor-sort-menu"]')?.getAttribute("aria-expanded")
  )
  check("aria-expanded pasa a true al abrir", expanded === "true", `valor=${expanded}`)

  const menu = await page.evaluate(() => {
    const m = document.getElementById("mentor-sort-menu")
    if (!m) return null
    return {
      role: m.getAttribute("role"),
      labelled: !!m.getAttribute("aria-label"),
      options: m.querySelectorAll("[role='menuitemradio']").length,
      checked: m.querySelectorAll("[aria-checked='true']").length,
    }
  })
  check(
    "el panel es role=menu con aria-label y menuitemradio",
    menu?.role === "menu" && menu.labelled && menu.options > 0 && menu.checked === 1,
    JSON.stringify(menu)
  )

  await page.keyboard.press("Escape")
  await new Promise((r) => setTimeout(r, 500))
  const afterEsc = await page.evaluate(() => ({
    expanded: document.querySelector('[aria-controls="mentor-sort-menu"]')?.getAttribute("aria-expanded"),
    focused: document.activeElement?.getAttribute("aria-controls"),
  }))
  check(
    "Escape cierra el desplegable",
    afterEsc.expanded === "false",
    `aria-expanded=${afterEsc.expanded}`
  )
  check(
    "el foco vuelve al boton que abria el desplegable",
    afterEsc.focused === "mentor-sort-menu",
    `foco en ${afterEsc.focused ?? "otro elemento"}`
  )
  void trigger
  await page.close()
}

// ------------------------------------------------ prefers-reduced-motion
{
  console.log("\n[3] prefers-reduced-motion: reduce pausa el video del hero")
  for (const reduce of [false, true]) {
    const page = await browser.newPage()
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" },
    ])
    await page.setViewport({ width: 390, height: 844 })
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1200))
    const state = await page.evaluate(() => {
      const v = document.querySelector("video")
      return v ? { paused: v.paused, ready: v.readyState } : null
    })
    check(
      reduce
        ? "con reduce: el video esta pausado"
        : "sin reduce: el video se reproduce",
      reduce ? state?.paused === true : state?.paused === false,
      JSON.stringify(state)
    )
    await page.close()
  }
}

// ------------------------------------------------------ labels de auth
{
  console.log("\n[4] Formularios de auth: labels, autocomplete y role=alert")
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })
  for (const path of ["/auth/signin", "/auth/register"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2", timeout: 60000 })
    const audit = await page.evaluate(() => {
      const controls = [...document.querySelectorAll("input, textarea")]
      return {
        total: controls.length,
        unlabelled: controls.filter((el) => {
          const byFor = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
          const wrapped = el.closest("label")
          return !byFor && !wrapped && !el.getAttribute("aria-label")
        }).length,
        withoutAutocomplete: controls.filter(
          (el) => !el.getAttribute("autocomplete")
        ).length,
        clickableLabels: [...document.querySelectorAll("label[for]")].length,
      }
    })
    check(
      `${path}: todos los controles tienen nombre accesible`,
      audit.unlabelled === 0,
      `${audit.total - audit.unlabelled}/${audit.total} con nombre`
    )
    check(
      `${path}: todos los controles tienen autocomplete`,
      audit.withoutAutocomplete === 0,
      `${audit.withoutAutocomplete} sin autocomplete`
    )
  }

  // Un error de validacion debe anunciarse, no solo verse.
  //
  // Con `noValidate` el navegador se salta su propia validacion, asi que el
  // unico filtro es el del servidor (zod) y el resultado es el mismo en cada
  // ejecucion. Antes este test usaba un email fijo: la primera vez registraba un
  // usuario de verdad y las siguientes caian en "el email ya esta registrado".
  // Ambas ramas mostraban role="alert", pero una de ellas ademas escribia en la
  // base de datos, y el test dependia del estado en que estuviera.
  await page.goto(`${BASE}/auth/register`, { waitUntil: "networkidle2", timeout: 60000 })
  await page.evaluate(() => {
    document.querySelector("form").noValidate = true
  })
  await page.type("#name", "UsuarioDePrueba")
  await page.type("#email", "esto-no-es-un-correo")
  await page.type("#password", "contrasena-larga")
  await page.click("form button")
  // La server action hashea con bcrypt (coste 12) y ademas intenta abrir la
  // conexion con la base de datos, que puede tardar varios segundos en fallar.
  // Esperar un tiempo fijo daba falsos negativos.
  await page
    .waitForFunction(() => document.querySelector("[role='alert']") !== null, {
      timeout: 30000,
    })
    .catch(() => {})
  const announced = await page.evaluate(() => {
    const alerts = [...document.querySelectorAll("[role='alert']")]
    return { count: alerts.length, text: alerts.map((a) => a.textContent.trim()).join(" | ") }
  })
  check(
    "el error de servidor del registro se anuncia con role=alert",
    announced.count > 0,
    announced.count > 0 ? announced.text.slice(0, 90) : "no aparecio ningun role=alert"
  )
  await page.close()
}

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${"-".repeat(62)}`)
console.log(`Comprobaciones: ${results.length}   pasan: ${results.length - failed.length}   fallan: ${failed.length}`)
if (failed.length) {
  console.log("\nFallan:")
  for (const f of failed) console.log(`  - ${f.name}  ${f.detail}`)
}
process.exit(failed.length === 0 ? 0 : 1)
