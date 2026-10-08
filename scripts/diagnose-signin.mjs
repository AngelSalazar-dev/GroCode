/**
 * Diagnostico del sign-in: hace el flujo de credenciales a mano e imprime TODAS
 * las cabeceras de respuesta para ver si la cookie de sesion se emite, con que
 * nombre y con que atributos.
 *
 * Uso: node scripts/diagnose-signin.mjs [puerto]
 * Requiere SMOKE_DATABASE_URL y AUTH_SECRET en el entorno.
 */
import { spawn } from "node:child_process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const PORT = Number(process.env.SMOKE_PORT ?? 3997)
const BASE = `http://127.0.0.1:${PORT}`
const ROOT = process.cwd()

const NEXT_CLI = resolve(ROOT, "node_modules", "next", "dist", "bin", "next")
const clientUrl = pathToFileURL(resolve(ROOT, "src/generated-v2/client/index.js")).href
const { PrismaClient } = await import(clientUrl)
const bcrypt = (await import("bcryptjs")).default
const prisma = new PrismaClient()

const email = `diag-${Date.now()}@example.com`
const password = "contrasena-larga"

const server = spawn(process.execPath, [NEXT_CLI, "dev", "-p", String(PORT)], {
  cwd: ROOT,
  env: { ...process.env, SMOKE_TEST: "1" },
  stdio: ["ignore", "pipe", "pipe"],
})
let serverLog = ""
server.stdout.on("data", (d) => (serverLog += d))
server.stderr.on("data", (d) => (serverLog += d))

const jar = new Map()
const cookieHeader = () =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ")

function storeCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? []
  for (const c of raw) {
    const [pair] = c.split(";")
    const idx = pair.indexOf("=")
    if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
  }
  return raw
}

function show(label, res) {
  console.log(`\n--- ${label}`)
  console.log(`    status: ${res.status}  location: ${res.headers.get("location")}`)
  const setCookie = res.headers.getSetCookie?.() ?? []
  if (setCookie.length === 0) {
    console.log("    Set-Cookie: (ninguna)")
  } else {
    for (const c of setCookie) console.log(`    Set-Cookie: ${c}`)
  }
}

try {
  console.log(`\nCreando usuario de prueba ${email}`)
  await prisma.user.create({
    data: {
      name: "Diagnostico",
      email,
      password: await bcrypt.hash(password, 4),
      role: "JUNIOR",
      onboardingCompleted: true,
    },
  })
  console.log("  ok")

  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(`${BASE}/auth/signin`, { redirect: "manual" })
      if (r.status < 500) break
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n== 1. GET /api/auth/csrf`)
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { redirect: "manual" })
  show("respuesta csrf", csrfRes)
  storeCookies(csrfRes)
  const { csrfToken } = await csrfRes.json()
  console.log(`    csrfToken: ${csrfToken?.slice(0, 20)}...  cookie guardada: ${[...jar.keys()].join(", ")}`)

  console.log(`\n== 2. POST /api/auth/callback/credentials`)
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/feed`,
  })
  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(),
    },
    body,
  })
  show("respuesta de signin", signInRes)
  storeCookies(signInRes)
  console.log(`    cookies ahora: ${[...jar.keys()].join(", ") || "(ninguna)"}`)

  console.log(`\n== 3. GET /api/auth/session con la cookie`)
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    redirect: "manual",
    headers: { cookie: cookieHeader() },
  })
  show("respuesta session", sessionRes)
  const text = await sessionRes.text()
  console.log(`    cuerpo: ${text.slice(0, 200)}`)

  console.log(`\n== 4. GET /feed con la cookie`)
  const feedRes = await fetch(`${BASE}/feed`, {
    redirect: "manual",
    headers: { cookie: cookieHeader() },
  })
  console.log(`    status: ${feedRes.status}  location: ${feedRes.headers.get("location")}`)

  if (serverLog) {
    console.log(`\n== log del servidor (ultimas lineas)`)
    for (const line of serverLog.split("\n").slice(-15)) console.log(`    ${line}`)
  }
} finally {
  await prisma.user.delete({ where: { email } }).catch(() => {})
  await prisma.$disconnect()
  server.kill()
  await new Promise((r) => setTimeout(r, 1000))
  server.kill("SIGKILL")
  process.exit(0)
}