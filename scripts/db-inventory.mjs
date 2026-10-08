/**
 * Inventario de solo lectura de la base de datos: cuantas filas hay por tabla y
 * si el esquema esta por detras del que espera el codigo.
 *
 * No escribe nada. Sirve para decidir si las migraciones se pueden aplicar sin
 * riesgo o si hay que preservar datos antes.
 *
 * Uso: node scripts/db-inventory.mjs
 */
import { readFile } from "node:fs/promises"
import { PrismaClient } from "../src/generated-v2/client/index.js"

const prisma = new PrismaClient()

const TABLES = [
  "user", "post", "like", "bookmark", "comment",
  "notification", "seniorApplication", "account", "session",
  "verificationToken", "mentorshipRequest", "accountSession",
]

try {
  console.log("\n=== filas por tabla ===")
  let total = 0
  for (const t of TABLES) {
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS n FROM \`${t}\``)
      const n = Number(rows[0].n)
      total += n
      console.log(`  ${t.padEnd(22)} ${String(n).padStart(6)}`)
    } catch {
      console.log(`  ${t.padEnd(22)}   (no existe)`)
    }
  }
  console.log(`  ${"TOTAL".padEnd(22)} ${String(total).padStart(6)}`)

  console.log("\n=== usuarios por rol ===")
  try {
    const roles = await prisma.$queryRawUnsafe(
      "SELECT role, COUNT(*) AS n FROM `user` GROUP BY role ORDER BY role"
    )
    for (const r of roles) console.log(`  ${String(r.role).padEnd(10)} ${r.n}`)
  } catch {
    console.log("  (no se pudo leer)")
  }

  console.log("\n=== columnas que el codigo espera y la BD no tiene ===")
  // Se derivan de schema.prisma para no comprobar columnas inventadas: si se
  // anade un campo al esquema, esta lista lo detecta; si se quita, tambien.
  const schema = await readFile(
    new URL("../prisma/schema.prisma", import.meta.url),
    "utf8"
  )
  const EXPECTED = [
    ["User", "onboardingCompleted"],
    ["Post", "channel"],
    ["Post", "createdAt"],
    ["Follow", "createdAt"],
  ]
  for (const [table, col] of EXPECTED) {
    const declared = new RegExp(`model\\s+${table}\\s*\\{[^}]*?\\b${col}\\b`, "s").test(schema)
    if (!declared) {
      console.log(`  ${table}.${col}  (no esta en schema.prisma: no se comprueba)`)
      continue
    }
    try {
      await prisma.$queryRawUnsafe(`SELECT \`${col}\` FROM \`${table}\` LIMIT 0`)
      console.log(`  ${table}.${col}  ok`)
    } catch {
      console.log(`  ${table}.${col}  FALTA EN LA BD`)
    }
  }

  console.log("\n=== historial de migraciones aplicado ===")
  try {
    const applied = await prisma.$queryRawUnsafe(
      "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at"
    )
    if (applied.length === 0) console.log("  (ninguna)")
    for (const a of applied) {
      console.log(`  ${a.migration_name}  ${a.finished_at ?? "SIN TERMINAR"}`)
    }
  } catch {
    console.log("  (tabla _prisma_migrations inexistente)")
  }

  console.log("\n=== indices de Post (el feed hacia full-scan sin ellos) ===")
  try {
    const idx = await prisma.$queryRawUnsafe("SHOW INDEX FROM `post`")
    const names = [...new Set(idx.map((i) => i.Key_name))]
    console.log(`  ${names.length} indice(s): ${names.join(", ")}`)
  } catch {
    console.log("  (no se pudo leer)")
  }
} finally {
  await prisma.$disconnect()
}
