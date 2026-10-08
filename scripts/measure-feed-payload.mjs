/**
 * Payload size comparison for the feed.
 *
 * Serializes a synthetic post through both the old and the new selection so the
 * difference is a number rather than an assertion. Synthetic on purpose: the
 * only reachable database is production and this writes nothing.
 *
 *   node scripts/measure-feed-payload.mjs [likesPerPost] [postsPerPage]
 */

const LIKES = Number(process.argv[2] ?? 250)
const POSTS = Number(process.argv[3] ?? 10)

const author = {
  id: "u1",
  name: "Ana Martínez",
  image: "https://api.dicebear.com/9.x/adventurer/svg?seed=Ana",
  role: "SENIOR",
}

const comments = Array.from({ length: 5 }, (_, i) => ({
  id: `c${i}`,
  content: "Comentario de ejemplo con longitud razonable para medir.".repeat(3),
  createdAt: new Date().toISOString(),
  user: author,
}))

const interactions = Array.from({ length: LIKES }, (_, i) => ({
  userId: `user_${i.toString().padStart(6, "0")}`,
}))

const content =
  "Este es el contenido de una publicación de ejemplo que representa el tamaño típico de un post real publicado en la plataforma, con longitud suficiente para que la medición sea representativa."

// --- BEFORE: full interaction lists shipped to the client -------------------
const before = {
  id: "p1",
  content,
  resourceUrl: null,
  channel: "general",
  createdAt: new Date().toISOString(),
  author,
  likes: interactions,
  bookmarks: interactions,
  comments,
}

// --- AFTER: server counts + only the viewer's own row ----------------------
const after = {
  id: "p1",
  content,
  resourceUrl: null,
  channel: "general",
  createdAt: new Date().toISOString(),
  author,
  _count: { likes: LIKES, bookmarks: LIKES, comments: comments.length },
  likes: [{ userId: "viewer" }],
  bookmarks: [],
  comments,
}

const bytes = (o) => Buffer.byteLength(JSON.stringify(o), "utf8")
const fmt = (n) => `${(n / 1024).toFixed(1)} KB`

const perPostBefore = bytes(before)
const perPostAfter = bytes(after)
const totalBefore = perPostBefore * POSTS
const totalAfter = perPostAfter * POSTS

console.log(`\nPost con ${LIKES} interacciones, página de ${POSTS} posts\n`)
console.log(`  ANTES  por post ${fmt(perPostBefore).padStart(10)}   página ${fmt(totalBefore).padStart(10)}`)
console.log(`  AHORA  por post ${fmt(perPostAfter).padStart(10)}   página ${fmt(totalAfter).padStart(10)}`)
console.log(
  `\n  Reducción: ${(100 - (totalAfter / totalBefore) * 100).toFixed(2)}%  ` +
    `(${(totalBefore / totalAfter).toFixed(0)}× más ligero)\n`
)

console.log(`  Identificadores de usuario expuestos por página:`)
console.log(`    antes  ${POSTS * LIKES * 2}`)
console.log(`    ahora  ${POSTS * 2}`)
console.log(`\n  (dato sintético, no se ha escrito en ninguna base de datos)\n`)