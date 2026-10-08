/**
 * Vuelca el contenido actual de la base de datos a JSON, sin transformar las
 * columnas BLOB/TIMESTAMP. Sirve como artefacto de recuperacion antes de un
 * reset: son 13 filas, pero perderlas sin copia seria trabajar a ciegas.
 *
 * Uso: node scripts/db-dump.mjs [fichero]
 */
import { writeFile } from "node:fs/promises"
import { PrismaClient } from "../src/generated-v2/client/index.js"

const OUT = process.argv[2] ?? ".next/db-backup.json"

const prisma = new PrismaClient()

const TABLES = [
  "user", "post", "like", "bookmark", "comment",
  "notification", "seniorApplication", "account", "session",
  "verificationToken", "mentorshipRequest",
]

try {
  const dump = { generatedAt: new Date().toISOString(), tables: {} }
  let total = 0

  for (const table of TABLES) {
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``)
      // Las fechas y los Decimal no son JSON serializables tal cual.
      dump.tables[table] = rows.map((r) =>
        Object.fromEntries(
          Object.entries(r).map(([k, v]) => [
            k,
            v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : String(v),
          ])
        )
      )
      total += rows.length
      console.log(`  ${table.padEnd(22)} ${rows.length}`)
    } catch {
      console.log(`  ${table.padEnd(22)} (no existe)`)
    }
  }

  // Las contrasenas hasheadas son sensibles: no se dejan en un fichero de texto.
  const users = dump.tables.user ?? []
  for (const u of users) {
    if (u.password) u.password = `hash-omitido-longitud-${u.password.length}`
  }

  dump.totalRows = total
  await writeFile(OUT, JSON.stringify(dump, null, 2), "utf8")
  console.log(`\n${total} filas -> ${OUT}`)
  console.log("Las contrasenas hasheadas se han sustituido por su longitud.")
} finally {
  await prisma.$disconnect()
}
