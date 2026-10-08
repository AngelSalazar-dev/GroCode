/**
 * Crea la base de datos desechable para el smoke test autenticado y le aplica
 * el esquema, sin tocar la base de desarrollo.
 *
 * El smoke test escribe y borra filas, asi que no puede apuntar a `growcode`.
 * Esta crea `growcode_smoke` en el mismo servidor y la deja lista.
 *
 * Uso: node scripts/setup-smoke-db.mjs
 */
import { readFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"

const SMOKE_DB = "growcode_smoke"

const envText = await readFile(".env", "utf8")
const raw = envText.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m)
if (!raw) {
  console.error("  No se encontro DATABASE_URL en .env")
  process.exit(2)
}

const mainUrl = new URL(raw[1].trim())
const dbName = mainUrl.pathname.replace(/^\//, "")

// La URL clonada conserva usuario y contrasena: no hace falta reconstruirlos, y
// montar la cadena a mano era la forma facil de meter un caracter sin escapar.
const smokeUrl = new URL(mainUrl.toString())
smokeUrl.pathname = `/${SMOKE_DB}`

console.log(`  base de desarrollo : ${dbName}  (no se toca)`)
console.log(`  base del smoke     : ${SMOKE_DB}`)

const prismaBin = process.platform === "win32" ? "npx.cmd" : "npx"

function run(args, label) {
  console.log(`  ${label}...`)
  try {
    execFileSync(prismaBin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      env: { ...process.env, DATABASE_URL: smokeUrl.toString() },
    })
    console.log(`  ✓ ${label}`)
    return true
  } catch (e) {
    console.error(`  ✗ ${label}`)
    console.error(String(e.stderr ?? e.message).split("\n").slice(0, 8).map((l) => "      " + l).join("\n"))
    return false
  }
}

// db push crea la base si no existe.
if (!run(["prisma", "db", "push", "--force-reset", "--skip-generate"], `creando y sincronizando ${SMOKE_DB}`)) {
  process.exit(1)
}

// La URL para el smoke test, con la contraseña sustituida para poder imprimirla.
const printable = smokeUrl.toString().replace(/:[^:@]+@/, ":***@")
console.log(`\n  SMOKE_DATABASE_URL=${printable}`)
console.log("\n  Copiala en .env (o pasala solo a ese comando) para habilitar el smoke test.")