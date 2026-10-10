/**
 * Invariante de `next/image`: toda imagen cuya `src` no sea una ruta local
 * literal tiene que llevar `unoptimized`.
 *
 * `User.image` es una columna que puede escribir el usuario (editor del perfil,
 * GitHub OAuth, DiceBear), o sea que su host es arbitrario. El optimizador de
 * Next exige que el host este en `images.remotePatterns` y, si no esta, lanza
 * durante el render: la pagina entera cae. Pasaba en `AccountMenu`, que
 * renderizaba `user.image` con un `<Image>` propio mientras el resto de la app
 * usaba `UserAvatar`, que ya lleva `unoptimized` a proposito.
 *
 * No se puede reproducir en el smoke: el `authorize` de credentials no devuelve
 * `image`, asi que `session.user.image` es null y el `<Image>` nunca llega a
 * pintarse. Solo se ve entrando con GitHub. Comprobar el codigo si es la unica
 * forma de que esto no vuelva.
 */
import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const SRC = join(process.cwd(), "src")

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      // generated-v2 is Prisma's emitted client, not ours to police.
      if (entry === "generated-v2" || entry === "node_modules") return []
      return tsxFiles(full)
    }
    return entry.endsWith(".tsx") ? [full] : []
  })
}

/** Drop block comments so prose like "no un `<Image>` propio" is not a hit. */
function stripComments(source: string): string {
  // Blanked out rather than deleted: replacing with spaces keeps every offset,
  // and therefore every line number, exactly where it was.
  return source.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length))
}

/** Each `<Image ...>` opening tag, with its line number in the source file. */
function imageTags(file: string): { line: number; tag: string }[] {
  const source = stripComments(readFileSync(file, "utf8"))
  const tags: { line: number; tag: string }[] = []
  const re = /<Image\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    // The tag ends at the first `>` that is not inside a `{...}` expression.
    let i = re.lastIndex
    let depth = 0
    for (; i < source.length; i++) {
      const ch = source[i]
      if (ch === "{") depth++
      else if (ch === "}") depth--
      else if (ch === ">" && depth === 0) break
    }
    tags.push({ line: source.slice(0, m.index).split("\n").length, tag: source.slice(m.index, i) })
  }
  return tags
}

/** `src` pointing at our own origin needs no pattern; anything else is suspect. */
function srcIsLocalLiteral(tag: string): boolean {
  return /src\s*=\s*"/.test(tag)
}

describe("next/image: solo se optimiza lo que es local y literal", () => {
  it("no hay ningun <Image> con src remoto y sin unoptimized", () => {
    const offenders: string[] = []

    for (const file of tsxFiles(SRC)) {
      for (const { line, tag } of imageTags(file)) {
        if (srcIsLocalLiteral(tag)) continue
        if (/\bunoptimized\b/.test(tag)) continue
        offenders.push(`${relative(process.cwd(), file)}:${line}`)
      }
    }

    expect(offenders).toEqual([])
  })

  it("el invariante tiene al menos un sitio que lo cumpla (si no, no mira nada)", () => {
    // Guard contra un test que pasa de verdad por no encontrar nada que mirar.
    const compliant = tsxFiles(SRC).flatMap((file) =>
      imageTags(file)
        .filter(({ tag }) => !srcIsLocalLiteral(tag) && /\bunoptimized\b/.test(tag))
        .map(() => relative(process.cwd(), file))
    )

    expect(compliant.length).toBeGreaterThan(0)
  })
})