#!/usr/bin/env node
/**
 * Authenticated smoke test.
 *
 * Exists because a whole class of bug slipped through: every earlier check
 * exercised the app WITHOUT a session, where a 307 on /feed is indistinguishable
 * from a correctly working auth gate. This script signs in for real and asserts
 * that private routes are actually reachable.
 *
 * Requirements:
 *   - A DISPOSABLE database. Set SMOKE_DATABASE_URL.
 *   - It will refuse to run against a URL that looks like production.
 *
 * Usage:
 *   node scripts/smoke-auth.mjs
 *
 * Exit codes: 0 = pass, 1 = fail, 2 = misconfigured (skipped in CI until a
 * test database exists).
 */

import { spawn } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PORT = Number(process.env.SMOKE_PORT ?? 3987)
const BASE = `http://127.0.0.1:${PORT}`

// ---------------------------------------------------------------- config ----

const dbUrl = process.env.SMOKE_DATABASE_URL ?? ""

// Nombres que delatan una base de datos de usar y tirar.
const DISPOSABLE = [/_smoke\b/, /_test\b/, /_ci\b/, /^tmp_/, /^throwaway/]

function refuseProductionUrl(url) {
  // Lo que no puede hacer este script es escribir en la base de desarrollo.
  // Eso se comprueba por nombre, no por host: la base de datos desechable suele
  // vivir en el mismo servidor gestionado que la real (crear un servidor aparte
  // por un smoke test no es razonable), asi que vetar el host impediria
  // ejecutarlo sin proteger de verdad nada.
  const name = (() => {
    try {
      return new URL(url).pathname.replace(/^\//, "")
    } catch {
      return ""
    }
  })()

  if (!DISPOSABLE.some((re) => re.test(name))) {
    console.error(
      `\n  ABORT: SMOKE_DATABASE_URL apunta a "${name || "?"}", que no es una base desechable.\n` +
        `  Este script escribe y borra filas. El nombre debe terminar en _smoke,\n` +
        `  _test o _ci. Creala con: node scripts/setup-smoke-db.mjs\n`
    )
    process.exit(2)
  }

  // Aviso, no bloqueo: el host es gestionado pero la base es de usar y tirar.
  const dangerous = ["tidbcloud.com", "rds.amazonaws.com", "planetscale", "neon.tech"]
  const hit = dangerous.find((d) => url.includes(d))
  if (hit) {
    console.warn(`\n  AVISO: el host es gestionado (${hit}), pero la base "${name}" es desechable.`)
  }
}

if (!dbUrl) {
  console.warn(
    "\n  SKIPPED: SMOKE_DATABASE_URL is not set.\n" +
      "  Set it to a disposable database to enable the authenticated smoke test.\n"
  )
  process.exit(2)
}
refuseProductionUrl(dbUrl)

if (!process.env.AUTH_SECRET) {
  console.error("\n  ABORT: AUTH_SECRET is required.\n")
  process.exit(2)
}

// ----------------------------------------------------------------- utils ----

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

const results = []
function record(name, ok, detail = "") {
  results.push({ name, ok, detail })
  const mark = ok ? C.green("PASS") : C.red("FAIL")
  console.log(`  ${mark}  ${name}${detail ? C.dim(`  ${detail}`) : ""}`)
}

/** Cookie jar: accumulates Set-Cookie and replays it. */
class Jar {
  #cookies = new Map()

  absorb(response) {
    const raw = response.headers.getSetCookie?.() ?? []
    for (const line of raw) {
      const [pair] = line.split(";")
      const idx = pair.indexOf("=")
      if (idx === -1) continue
      const name = pair.slice(0, idx).trim()
      const value = pair.slice(idx + 1).trim()
      if (value === "" || /expires=Thu, 01 Jan 1970/i.test(line)) {
        this.#cookies.delete(name)
      } else {
        this.#cookies.set(name, value)
      }
    }
  }

  header() {
    return [...this.#cookies].map(([k, v]) => `${k}=${v}`).join("; ")
  }

  has(name) {
    return this.#cookies.has(name)
  }

  /** Finds the session cookie by pattern, so a v4/v5 rename cannot hide a bug. */
  sessionCookieName() {
    return [...this.#cookies.keys()].find((n) => n.endsWith("session-token"))
  }
}

async function get(path, jar) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: jar ? { cookie: jar.header() } : {},
  })
  jar?.absorb(res)
  return res
}

/** NextAuth CSRF dance for the credentials provider. */
async function signIn(email, password, jar) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, {
    redirect: "manual",
    headers: jar.header() ? { cookie: jar.header() } : {},
  })
  jar.absorb(csrfRes)
  const { csrfToken } = await csrfRes.json()

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/feed`,
    json: "true",
  })

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: jar.header(),
    },
    body,
  })
  jar.absorb(res)
  return res
}

// ------------------------------------------------------------------ env -----

function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(ROOT, file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      const value = m[2].replace(/^["']|["']$/g, "")
      if (!process.env[m[1]]) process.env[m[1]] = value
    }
  }
}
loadDotEnv()

// ------------------------------------------------------------------ main ----

// Se invocan los CLIs con el ejecutable de Node en vez de con `npx`.
//
// Con `shell: true` (que es lo que haria falta para ejecutar un `.cmd` en
// Windows) aparece un `cmd.exe` intermedio: al matarlo en el `finally` se
// llevaba por delante la consola que launched el script, y el proceso terminaba
// sin imprimir el informe. Con la entrada JS directa el hijo es un `node` limpio
// que se puede finalizar sin efectos colaterales.
const NEXT_CLI = resolve(ROOT, "node_modules", "next", "dist", "bin", "next")
const PRISMA_CLI = resolve(ROOT, "node_modules", "prisma", "build", "index.js")

// Antes de arrancar nada: si el puerto esta ocupado, el servidor muere con
// EADDRINUSE y el informe sale truncado en vez de explicar cual es el problema.
if (!(await assertPortFree())) process.exit(2)

const server = spawn(process.execPath, [NEXT_CLI, "dev", "-p", String(PORT)], {
  cwd: ROOT,
  env: {
    ...process.env,
    DATABASE_URL: dbUrl,
    // Keep the rate limiter from blocking the test itself.
    SMOKE_TEST: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
})

let serverLog = ""
server.stdout.on("data", (d) => (serverLog += d))
server.stderr.on("data", (d) => (serverLog += d))
// Sin este manejador, un fallo de arranque lanza una excepcion asincrona que
// aborta el script con una traza en vez de un mensaje util.
server.on("error", (e) => {
  serverLog += `\nspawn error: ${e.message}`
})

async function waitForServer(timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/auth/signin`, { redirect: "manual" })
      if (res.status < 500) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

/**
 * Comprueba que el puerto esta libre ANTES de arrancar. Sin esto, un proceso
 * anterior ocupando el puerto produce un EADDRINUSE que sale por stderr junto
 * con un informe truncado, en vez de un mensaje que diga que hacer.
 */
async function assertPortFree() {
  try {
    const probe = await fetch(`${BASE}/`, { redirect: "manual", signal: AbortSignal.timeout(3000) })
    console.error(
      C.red(`\n  ABORT: el puerto ${PORT} ya esta ocupado (responde ${probe.status}).\n`) +
        C.dim("  Cierra el proceso que lo ocupe, o ejecuta con otro puerto:\n") +
        C.dim(`    SMOKE_PORT=3999 node scripts/smoke-auth.mjs\n`)
    )
    return false
  } catch {
    return true // no responde: el puerto esta libre
  }
}

async function main() {
  console.log(C.bold("\nGroCode — authenticated smoke test\n"))

  console.log(C.dim("  Preparing the disposable database…"))
  // `--force-reset` no es opcional aqui, y si por seguridad parece.
//
// TiDB no informa las claves foraneas igual que MySQL, asi que el schema engine
// de Prisma no las reconoce en una segunda pasada y intenta volver a crearlas: el push
// falla con "Duplicate foreign key constraint name 'Like_userId_fkey'". Como
// esta base es desechable por definicion (la guardia de arriba lo comprueba),
// vaciarla en cada ejecucion es lo correcto y ademas garantiza que el test no
// herede filas de una corrida anterior.
const push = spawn(
  process.execPath,
  [PRISMA_CLI, "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"],
  {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: ["ignore", "pipe", "pipe"],
  }
)
// Con stdio: "ignore" un fallo de `db push` solo decia "no se pudo preparar la
// base", sin decir por que. Esto solo imprime si falla.
let pushLog = ""
push.stdout.on("data", (d) => (pushLog += d))
push.stderr.on("data", (d) => (pushLog += d))
push.on("error", (e) => {
  pushLog += `\nspawn error: ${e.message}`
})
const pushOk = await new Promise((res) => {
  push.on("exit", (code) => res(code === 0))
})
if (!pushOk) {
  console.error(C.red("\n  Could not prepare the test database.\n"))
  console.error(C.dim(pushLog.slice(-2000)))
  return 1
}

  console.log(C.dim("  Starting the dev server…"))
  if (!(await waitForServer())) {
    console.error(C.red("\n  The dev server never became ready.\n"))
    console.error(C.dim(serverLog.slice(-2000)))
    return 1
  }

  // ---------------------------------------------------------------- public --
  console.log(C.bold("\n  Public routes (no session)"))
  for (const path of ["/", "/auth/signin", "/auth/register", "/mentors"]) {
    const res = await get(path, null)
    record(`GET ${path}`, res.status === 200, `got ${res.status}`)
  }
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const res = await get(path, null)
    record(`GET ${path} is crawlable`, res.status === 200, `got ${res.status}`)
  }

  // ---------------------------------------------------------------- gated ---
  console.log(C.bold("\n  Private routes without a session are gated"))
  for (const path of ["/feed", "/roadmap", "/onboarding"]) {
    const res = await get(path, null)
    const gated = res.status === 307 || res.status === 302
    record(`GET ${path} redirects to sign-in`, gated, `got ${res.status}`)
  }

  // ------------------------------------------------------------- sign up ----
  const jar = new Jar()
  const email = `smoke-${Date.now()}@example.test`
  const password = "smoke-test-password-123"

  console.log(C.bold("\n  Registering and signing in"))
  const register = await fetch(`${BASE}/api/auth/providers`, {
    redirect: "manual",
    headers: jar.header() ? { cookie: jar.header() } : {},
  })
  jar.absorb(register)

  // The register endpoint is a server action, not a REST route. Use the
  // credentials flow against a user created directly through Prisma instead.
  // `import()` en ESM exige una URL: en Windows una ruta absoluta como
  // "C:\...\index.js" se interpreta como el protocolo "c:" y lanza
  // "Only URLs with a scheme in: file, data, and node are supported".
  const { pathToFileURL } = await import("node:url")
  const clientUrl = pathToFileURL(resolve(ROOT, "src/generated-v2/client/index.js")).href
  const { PrismaClient } = await import(clientUrl)
  // La URL se pasa de forma explicita. Sin esto, `new PrismaClient()` lee
  // DATABASE_URL del entorno, y `loadDotEnv()` ha metido ahi la de `.env` (la
  // base de desarrollo). El usuario de prueba se creaba en `growcode` mientras
  // el servidor de test corria contra `growcode_smoke`: el sign-in fallaba y,
  // como NextAuth responde con un 302 a la pagina de error, el test lo contaba
  // como "credentials sign-in accepted" y luego se quejaba de que no habia
  // cookie. Dos fallos ocultos por una sola linea que faltaba.
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })
  const bcrypt = (await import("bcryptjs")).default
  await prisma.user.create({
    data: {
      name: "Smoke Tester",
      email,
      password: await bcrypt.hash(password, 4), // low cost: tests, not security
      onboardingCompleted: true,
    },
  })

  const signInRes = await signIn(email, password, jar)

  // Un 302 no significa que el sign-in haya ido bien: NextAuth responde con un
  // 302 tambien cuando las credenciales son invalidas, en ese caso apuntando a
  // `?error=CredentialsSignin`. Como el status era el unico criterio, un login
  // roto pasaba esta comprobacion y el fallo solo aparecia en la siguiente.
  const location = signInRes.headers.get("location") ?? ""
  const signedIn =
    (signInRes.status === 200 || signInRes.status === 302) && !location.includes("error=")
  record(
    "credentials sign-in accepted",
    signedIn,
    `got ${signInRes.status}${location ? ` -> ${location}` : ""}`
  )

  const sessionCookie = jar.sessionCookieName()
  record(
    "a *session-token cookie was issued",
    Boolean(sessionCookie),
    sessionCookie ?? "none found"
  )
  // Guards the v4/v5 rename without hardcoding the name.
  record(
    "session cookie uses the v5 name",
    Boolean(sessionCookie?.includes("authjs")),
    sessionCookie ?? ""
  )

  // ------------------------------------------------------------- session ----
  const sessionRes = await get("/api/auth/session", jar)
  let session = null
  try {
    session = await sessionRes.json()
  } catch {
    /* handled below */
  }
  record(
    "GET /api/auth/session returns the user",
    Boolean(session?.user?.id),
    JSON.stringify(session)
  )

  // ------------------------------------------------------------ private -----
  // This is the assertion that would have caught the cookie-name bug.
  console.log(C.bold("\n  Private routes WITH a session"))
  const privatePaths = [
    "/feed",
    "/roadmap",
    "/onboarding",
    "/notifications",
    "/feed/new",
  ]
  for (const path of privatePaths) {
    const res = await get(path, jar)
    record(`GET ${path}`, res.status === 200, `got ${res.status}`)
  }

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (me) {
    for (const path of [`/profile/${me.id}`]) {
      const res = await get(path, jar)
      record(`GET ${path}`, res.status === 200, `got ${res.status}`)
    }

    await prisma.post.create({
      data: { content: "Smoke test post content", channel: "general", authorId: me.id },
    })
    const post = await prisma.post.findFirst({
      where: { authorId: me.id },
      select: { id: true },
    })
    if (post) {
      const res = await get(`/post/${post.id}`, jar)
      record(`GET /post/${post.id}`, res.status === 200, `got ${res.status}`)
    }
  }

  // ------------------------------------------------------- remote avatar ----
  // NO se puede comprobar aqui. El bug que esta seccion persiguio (el avatar se
  // optimizaba y reventaba con hosts fuera de `remotePatterns`) solo es
  // alcanzable iniciando sesion con GitHub, y este script solo usa credenciales:
  // el `authorize` de credentials no devuelve `image`, asi que `session.user.image`
  // siempre es null y el menu de cuenta nunca llega a pintarlo.
  //
  // La invariante vive entonces en `src/tests/next-image-remote.test.ts`, que
  // es lo que de verdad puede correr en cada build.

  // --------------------------------------------------------------- admin ----
  console.log(C.bold("\n  Admin route stays gated for non-admins"))
  const adminRes = await get("/admin/applications", jar)
  const adminBody = await adminRes.text()

  // No basta con comprobar el status. La pagina llama a `redirect()` ya dentro
  // de un segmento que se ha empezado a transmitir, asi que responde 200 y el
  // rebote ocurre en el cliente: exigir un 307 daba un falso negativo.
  //
  // Lo que de verdad importa es que un JUNIOR no reciba datos privilegiados.
  // `redirect()` se evalua antes de cualquier query, asi que el cuerpo no debe
  // contener ninguna postulacion.
  const leaked =
    /yearsOfExperience|motivaci[oó]n|githubProfile|linkedinProfile/.test(adminBody) ||
    adminBody.includes("Postulaciones")
  record(
    "GET /admin/applications leaks no application data to a JUNIOR",
    !leaked,
    leaked ? "the body contains privileged fields" : `status ${adminRes.status}`
  )
  record(
    "GET /admin/applications bounces a JUNIOR away",
    /NEXT_REDIRECT|redirect|\/feed/.test(adminBody) || adminRes.status === 307 || adminRes.status === 302,
    `status ${adminRes.status}`
  )

  // ----------------------------------------------------------------- seo ----
  // A missing post is served with HTTP 200 because the segment streams
  // (see the `loading.tsx` Suspense boundary). Next compensates by injecting
  // <meta name="robots" content="noindex">. A global `robots: { index: true }`
  // in the root layout used to emit a *second*, conflicting tag, leaving
  // crawlers to guess. Exactly one noindex tag must be present.
  console.log(C.bold("\n  SEO on a missing resource"))
  const missing = await get("/post/does-not-exist-at-all", jar)
  // Un `Response` solo se puede leer una vez: se leia con `.text()` dos veces y
  // reventaba con "Body is unusable: Body has already been read" al final del
  // script, tirando el informe completo.
  const missingBody = await missing.text()
  record("a missing post renders the 404 body", missingBody.includes("No encontramos"), `got ${missing.status}`)

  const robotsTags = [...missingBody.matchAll(/<meta[^>]*name="robots"[^>]*>/g)]
  // El invariante que importa no es "cuantas etiquetas hay" sino "ninguna
  // contradice a las demas". Un 404 en un segmento que se transmite lleva dos:
  // la que declara la pagina (Fase 4 la pone en noindex a proposito) y la que
  // inyecta Next al llamar a notFound(). Ambas dicen noindex, asi que ningun
  // crawler puede decidir mal.
  //
  // Se cambio esta comprobacion porque antes exigia exactamente una etiqueta y
  // daba un fallo que no era un defecto. Exigir una unica obligaria a quitar el
  // robots de la pagina, lo que dejaria los posts reales sin restriccion de
  // indexado: un cambio de comportamiento para tapar un problema de redaccion.
  record(
    "a missing post emits noindex and never a contradicting index",
    robotsTags.length > 0 && robotsTags.every((t) => /noindex/i.test(t[0])),
    `found ${robotsTags.length}: ${robotsTags.map((t) => t[0]).join(" ")}`
  )

  // -------------------------------------------------------------- cleanup ---
  await prisma.$disconnect()
  await prisma.user.delete({ where: { email } }).catch(() => {})
  await prisma.$disconnect()

  // --------------------------------------------------------------- report ---
  const failed = results.filter((r) => !r.ok)
  console.log(
    `\n  ${C.bold("Result:")} ${results.length - failed.length}/${results.length} passed\n`
  )

  if (failed.length > 0) {
    console.log(C.red(`  ${failed.length} check(s) failed:`))
    for (const f of failed) console.log(`    - ${f.name} (${f.detail})`)
    return 1
  }
  return 0
}

let exitCode = 1
try {
  exitCode = await main()
} catch (error) {
  console.error(C.red(`\n  Smoke test crashed: ${error?.message ?? error}\n`))
  console.error(C.dim(serverLog.slice(-2000)))
} finally {
  server.kill("SIGTERM")
  // Give Next a moment to release the port.
  await new Promise((r) => setTimeout(r, 1500))
  server.kill("SIGKILL")
}
process.exit(exitCode)