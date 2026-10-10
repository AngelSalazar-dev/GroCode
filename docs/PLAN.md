# Plan de Remediación — GroCode

> **Estado:** pendiente de aprobación (CEO)
> **Creado:** a partir de la auditoría de 6 departamentos (Seguridad, Backend/Datos, QA, Producto, Design Engineering, SRE/DevOps)
> **Documento de seguimiento:** [`CHECKLIST.md`](./CHECKLIST.md)

---

## Por qué existe este plan

Una auditoría pordepartamentos sobre el estado actual encontró **5 bloqueantes**.
Tres de ellos hacen que **la app no funcione para un usuario que inicia sesión**.

| # | Bloqueante | Encontrado por |
|---|---|---|
| 1 | La cookie de sesión tiene otro nombre en NextAuth v5 → lockout total | SRE |
| 2 | El rol `ADMIN` nunca llega a la sesión → panel inaccesible | 5 de 6 departamentos |
| 3 | El panel de aceptar/rechazar mentoría es código muerto | Producto |
| 4 | Migraciones sin commitear y sin baseline | SRE |
| 5 | No hay forma de iniciar sesión en móvil | Design Engineering |

### La causa raíz común

**Nunca se probó una petición autenticada.** La verificación de enrutado se hizo
con 8 rutas sin sesión, donde un `307` en `/feed` es indistinguible entre
"gate funcionando" y "gate roto". Todo lo crítico sale de ese punto ciego.

Por eso la **Fase 0 es una red de seguridad, no una tarea más**.

---

## Principios de ejecución

1. **Primero el gate, luego los fixes.** Nada se arregla sin poder comprobar que quedó arreglado.
2. **Ningún cambio de schema se aplica a la BD hasta que el schema esté completo.**
   Un solo baseline + una migración consolidada, no tres despliegues nerviosos.
3. **Cada fase es verificable por separado** y reversible sin deshacer trabajo.
4. **Nada se toca en producción** sin aprobación explícita del CEO.

---

## Resumen de fases

| Fase | Objetivo | Riesgo | Esfuerzo | Acum. |
|---|---|---|---|---|
| **0** | Red de seguridad: poder *comprobar* | Bajo | 2 h | 2 h |
| **1** | Que la app funcione | Bajo | 2 h | 4 h |
| **2** | Móvil y compartir | Bajo | 2 h | 6 h |
| **3** | Seguridad | Medio | 4 h | 10 h |
| **4** | Datos | Bajo (schema) | 4 h | 14 h |
| **5** | Base de datos ⚠️ | **Alto** | 1 h + ventana | 15 h |
| **6** | Producto | Bajo | 6 h | 21 h |
| **7** | Accesibilidad | Bajo | 5 h | 26 h |
| **8** | Rendimiento | Bajo | 4 h | 30 h |
| **9** | Limpieza | Bajo | 3 h | 33 h |

**Fases 0–2 (6 h) dejan la app usable.** El resto es cortable.

---

# Fase 0 — Red de seguridad

Sin esto, todo lo demás son arreglos a ciegas.

## 0.1 Smoke test autenticado end-to-end

**Archivo nuevo: `scripts/smoke-auth.mjs`**

El cambio con más retorno de todo el plan. Hoy los 24 tests pasan mientras
tres bugs hacen la app inusable, porque nunca se ejecuta una petición con sesión.

Flujo:
1. Arranca `next dev` contra una base de datos desechable.
2. Registra un usuario por el endpoint real.
3. Inicia sesión y captura la cookie del `Set-Cookie` de la respuesta.
4. Verifica que las rutas privadas responden **200** y no 307.

| Ruta | Esperado | Nota |
|---|---|---|
| `/api/auth/session` | `{user:{id,role}}` | debe existir cookie de sesión |
| `/feed` | 200 | hoy 307 → detectaría el bug 1 |
| `/onboarding` | 200 | |
| `/roadmap` | 200 | |
| `/profile/<id>` | 200 | |
| `/post/<id>` | 200 | |
| `/admin/applications` | redirect si `role != ADMIN` | |

Reglas:
- El nombre de la cookie se lee del `Set-Cookie` real, **no** se hardcodea.
  Así el test falla si la app rompe la sesión, no si NextAuth renombra.
- Exit code 1 en fallo, para que CI lo bloquee.
- Nunca contra producción.

## 0.2 Tests unitarios que faltan

| Test | Qué fija | Por qué |
|---|---|---|
| `auth-callbacks.test.ts` | La cadena `jwt()` → `session()` preserva `ADMIN` | **Habría atrapado el bug 2 al escribirlo** |
| `notifications-security.test.ts` | `markAsRead`/`deleteNotification` no tocan filas ajenas | La decisión de seguridad más importante del repo, sin test |
| `rate-limit.test.ts` | Umbral exacto + `getClientIp` con header vacío | Único límite de login |
| `mentorship.test.ts` | Solo el senior destinatario responde; no se responde 2 veces | Núcleo del producto |

`auth-callbacks.test.ts` en detalle:

```ts
it("preserva ADMIN desde user hasta session", async () => {
  const token = await authConfig.callbacks.jwt!(
    { token: {}, user: { id: "u1", role: "ADMIN" } }, {})
  expect(token.role).toBe("ADMIN")          // hoy: undefined

  const session = await authConfig.callbacks.session!(
    { session: { user: {} }, token }, {})
  expect(session.user.role).toBe("ADMIN")    // hoy: "JUNIOR"
})

it("degrada a JUNIOR si el token no trae role", async () => {
  // fija el fallback seguro
})
```

## 0.3 CI

**`.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm              # key = hash de package-lock.json
      - run: npm ci --legacy-peer-deps
      - run: npx prisma generate
        env:
          DATABASE_URL: "mysql://u:p@localhost:3306/db?sslaccept=strict"
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: node scripts/smoke-auth.mjs   # ← el que importa
```

⚠️ Requiere una BD de test. Si no hay staging, este job arranca como
`continue-on-error` y se endurece tras la Fase 5.

---

# Fase 1 — Que la app funcione

Cinco bugs. Todos locales, todos verificables con el smoke test.

## 1.1 Cookie de sesión · BLOQUEANTE

`src/proxy.ts:26-28`

```diff
- const isLoggedIn =
-   cookies.has("next-auth.session-token") ||
-   cookies.has("__Secure-next-auth.session-token")
+ // NextAuth v5 renamed the session cookie to `authjs.session-token`.
+ const isLoggedIn =
+   cookies.has("authjs.session-token") ||
+   cookies.has("__Secure-authjs.session-token")
```

**Evidencia:** `next-auth.session-token` tiene **cero coincidencias** en
`node_modules/next-auth` y `node_modules/@auth/core`.
`@auth/core/lib/utils/cookie.js:49` emite `authjs.session-token`.

**Alternativa más robusta:** `getToken()` de `next-auth/jwt` no depende del
nombre ni del prefijo. Recomiendo la línea de arriba (bajo riesgo) **más** un
test que fije el comportamiento.

## 1.2 Rol ADMIN en la sesión · BLOQUEANTE

`src/auth/auth.config.ts:4-5`

```diff
- const isRole = (value: unknown): value is Role =>
-   value === Role.JUNIOR || value === Role.SENIOR
+ const isRole = (value: unknown): value is Role =>
+   Object.values(Role).includes(value as Role)
```

Cadena del fallo actual: `authorize()` sí devuelve `ADMIN` → `jwt()` lo rechaza →
`token.role` nunca se escribe → `session()` cae al `else` → `session.user.role = JUNIOR`.

Efecto colateral positivo: un `ADMIN` deja de pasar el check `role !== "JUNIOR"`
que le permitía pedir mentoría.

**Test de regresión:** el de 0.2. Sin él, vuelve a romperse al ampliar el enum.

## 1.3 Panel de mentoría alcanzable · BLOQUEANTE

`src/components/mentorship/MentorRequestButton.tsx`

Los guards se contradicen: L18 `if (session.user.id === seniorId) return null`
descarta exactamente lo que L39 exige. La rama de Aceptar/Rechazar nunca corre.

```diff
  if (!session?.user) return null
- if (session.user.id === seniorId) return null

- // Junior viendo perfil de Senior
- if (session.user.role === "JUNIOR" && seniorRole === "SENIOR") { ... }

- // Senior con solicitud pendiente (exigía seniorId === session.user.id)
- if (session.user.role === "SENIOR" && seniorId === session.user.id) { ... }

+ // El Senior en su propio perfil ve su bandeja de pendientes.
+ if (session.user.id === seniorId) {
+   if (session.user.role !== "SENIOR") return null
+   const incoming = await prisma.mentorshipRequest.findFirst({ ... })
+   if (!incoming) return null
+   return <RequestButtonClient … incomingRequest={{ ... }} />
+ }

+ // Un Junior en el perfil de un Senior.
+ if (session.user.role === "JUNIOR" && seniorRole === "SENIOR") { ... }

+ return null
```

Además en `RequestButtonClient.tsx`: `window.location.reload()` →
`router.refresh()` (recarga toda la página y pierde scroll y estado).

## 1.4 `feed/new` traga el error

Introducido en la fase anterior. En un `<form action>` de servidor lo correcto
es `useActionState`; pasar el error por la URL se pierde al reenviar y no es
accesible.

```diff
- async function submit(formData: FormData) {
-   "use server"
-   const result = await createPost(formData)
-   if ("error" in result) redirect(`/feed/new?error=${encodeURIComponent(result.error)}`)
- }
+ async function submit(prev: State, formData: FormData): Promise<State> {
+   "use server"
+   const result = await createPost(formData)
+   return "error" in result ? { error: result.error } : prev
+ }
```

```diff
- <form action={submit} className="space-y-6 gro-card p-8">
+ <form action={formAction} className="space-y-6 gro-card p-8">
+   {state.error && <p role="alert">{state.error}</p>}
```

Contrapartida: hay que resolver el `redirect` de éxito con `useEffect`.
**Ver decisión 5.**

## 1.5 Variables de entorno de NextAuth v5

v5 renombró las variables. `.env` y `.env.example`:

```diff
- NEXTAUTH_SECRET=...
- NEXTAUTH_URL=...
+ AUTH_SECRET=...      # generar con: npx auth secret
+ AUTH_URL=...
+ AUTH_TRUST_HOST=true
```

Y validación al arrancar en `src/auth/auth.ts`, para que falle en el primer
render en vez de a los tres días:

```ts
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET no configurado")
}
```

---

# Fase 2 — Móvil y compartir

## 2.1 Login en móvil · BLOQUEANTE

`src/components/NavbarClient.tsx:113`

Hoy `<div className="hidden sm:flex">` esconde "Ingresar"/"Registrarse" bajo
640px, y el burger solo se renderiza si `isLoggedIn`. **Un móvil no tiene
ninguna ruta de acceso a la cuenta.**

Propuesta: un botón de cuenta siempre visible. Con sesión → avatar + menú;
sin sesión → el icono ofrece "Ingresar / Registrarse". Un componente, sin
botón duplicado.

## 2.2 Logout duplicado

`NavbarClient.tsx:113` y `:136` renderizan `LogoutButton` dos veces, y
`LogoutButton.tsx:11` no tiene clases responsive → dos iconos idénticos visibles
en móvil. Se resuelve al unificar 2.1.

## 2.3 Enlaces de post y perfil públicos

`src/proxy.ts:8` — añadir `/post/` y `/profile/` a `PUBLIC_PATHS`.

Hoy el enlace que genera "Compartir" (`PostCard.tsx:105`) exige login: se copia
en WhatsApp y al otro le sale un muro de registro. El sitemap además anuncia a
Google URLs que rebotan.

⚠️ **Decisión 2.** Un perfil público expone nombre, bio, ubicación y web
(todo en `publicUserSelect`, sin email ni password). Coherente con `/mentors`,
que ya es público. La alternativa es un preview OG público con el post privado.

---

# Fase 3 — Seguridad

## 3.1 XSS almacenado vía `website` · ALTO

`src/actions/profile.ts:14-21`

`new URL("javascript:alert(1)")` es **válido**, así que la validación actual lo
acepta. Se guarda y se sirve como `href` a cualquiera que abra el perfil.

```diff
- const validateWebsite = (url: string) => {
-   try { new URL(url); return true } catch { return false }
- }
+ const validateWebsite = (url: string) => {
+   try {
+     const parsed = new URL(url)
+     // Reject non-http(s): `javascript:`, `data:`, `vbscript:` all parse fine.
+     return parsed.protocol === "https:" || parsed.protocol === "http:"
+   } catch { return false }
+ }
```

Extraer un `validateHttpUrl` compartido — la lógica correcta ya existe en
`actions/posts.ts:14-21`.

## 3.2 `getClientIp` no debe confiar en el cliente

`src/lib/rate-limit.ts:58-65`

Hoy prioriza `x-forwarded-for`, falsificable → el rate limit de login y registro
se evade rotando una cabecera.

```diff
- return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? …
+ // Set by the platform and not spoofable. x-forwarded-for is
+ // client-supplied and must be the LAST fallback.
+ return (
+   headers.get("x-vercel-forwarded-for") ||
+   headers.get("x-real-ip") ||
+   headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
+   "unknown"
+ )
```

Nota: `||` en lugar de `??`. Un header **presente y vacío** devuelve `""` con
`??`, y todos los clientes mal configurados colapsan en un bucket compartido.

## 3.3 Rate limiting distribuido · DECISIÓN 3

El `Map` en memoria es por instancia de lambda → el límite efectivo es N× el nominal.

| Opción | Coste | ¿Frena credential stuffing? |
|---|---|---|
| Vercel Firewall | Pro ($20/mes) | Sí, solo por IP; no ve el email |
| **Upstash Ratelimit** | **$0 en free tier** | Sí, y soporta el doble bucket `ip`+`email` ya usado |

**Recomiendo Upstash Ratelimit** (~40 líneas). La interfaz `limit()` ya está
diseñada para el swap.

Mientras tanto, 3.2 sube el coste del ataque pero **no lo elimina**.

## 3.4 Cabeceras de seguridad

`next.config.ts` → `headers()`:
- CSP `default-src 'self'` + `frame-ancestors 'none'` (protege el panel admin de clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

⚠️ La CSP necesita `'unsafe-inline'` para estilos o rompe Tailwind v4, y
`frame-src https://www.youtube-nocookie.com` para los iframes. Probar, no aplicar a ciegas.

## 3.5 Healthcheck

`src/app/api/health/route.ts` — `SELECT 1` con timeout, 503 si la BD no responde.
Allowlist en el proxy. Sin esto, "app caída" y "TiDB caído" son indistinguibles.

## 3.6 El rol nunca se revalida · DECISIÓN 4

`strategy: "jwt"` copia el rol al hacer login. Degradar a un admin **no le quita
los privilegios** hasta que expire el token; aprobar a alguien Senior no surte
efecto hasta su próximo login.

| Opción | Esfuerzo | Efecto |
|---|---|---|
| **(a)** Reloader de BD en `jwt()` con TTL de 5 min | 30 min | Cierra la ventana a 5 min |
| (b) `session.version` en BD, revocar al cambiar rol | 3 h | Inmediato |
| (c) Documentar el retardo | 5 min | Hasta 30 min de ventana |

**Recomiendo (a).**

## 3.7 `notify()` sin cota

Hay 12 llamadas a `limit()` en el repo, ninguna protegida de verdad.
`toggleFollow`, `toggleLike` y `addComment` no tienen ninguna. Un atacante
scripted genera filas de notificación sin parar.

## 3.8 Verificación de email y recuperación de contraseña

El modelo `VerificationToken` **ya existe** y está sin usar. Hoy cualquiera puede
registrar el email de otra persona y bloquearle el registro.

Son features, no bugs:
- **Verificación de email**: sí. Seguridad, barra baja, modelo ya existe.
- **Recuperación de contraseña**: depende de si se decide construir flujo de
  email. Es otro proyecto.

---

# Fase 4 — Datos

Todo esto entra en **una sola migración**, antes de tocar la BD (Fase 5).

## 4.1 Índices que faltan · ALTO

Hoy `Post` **no tiene ningún índice**. El feed hace
`WHERE channel=? ORDER BY createdAt DESC LIMIT 10` → escaneo completo + filesort por request.

```diff
  model Post {
    …
+ @@index([channel, createdAt(sort: Desc)])
  }
  model Comment {
    …
+   @@index([postId, createdAt])
  }
  model Like      { …  + @@index([postId]) }
  model Bookmark  { …  + @@index([postId]) }
```

4 líneas. Los `@@unique([userId, postId])` existentes tienen `userId` como
prefijo, inútil para `WHERE postId=?`.

## 4.2 Dejar de serializar `likes`/`bookmarks` completos · ALTO

`src/app/feed/page.tsx:35-45`, `src/app/profile/[id]/page.tsx:60-81`

`PostCard` solo necesita saber *si el viewer* dio like. Hoy el cliente recibe
el `userId` de **todos**: cualquier autenticado construye el grafo social completo.

```diff
- likes: { select: { userId: true } },
- bookmarks: { select: { userId: true } },
+ _count: { select: { likes: true, bookmarks: true, comments: true } },
+ // Only the viewer's own row, for pressed/unpressed state.
+ likesByViewer: { where: { userId: viewerId ?? "—" }, select: { userId: true }, take: 1 },
+ bookmarksByViewer: { where: { userId: viewerId ?? "—" }, select: { userId: true }, take: 1 },
```

Un post viral con 3.000 likes pasa de ~100 KB de payload a un booleano.

## 4.3 Acotar queries

- Comentarios del perfil: `take: 20` (hoy ilimitados).
- Posts del perfil: `take: 20` + paginación.
- `?page=` sin techo → `?page=100000000` genera `skip` de 1e9 filas. Clamp a 500.
- `generateMetadata` del perfil hace una segunda query a `User`: compartir vía `cache()`.

## 4.4 Unicidad en postulaciones

`SeniorApplication.userId` indexado pero **no único** → dos `applySenior`
concurrentes crean dos filas; una queda PENDING huérfana en el panel.

`@@unique([userId])` rompe el caso "re-solicitar tras rechazo". Mejor: índice no
único + `upsert` por `userId` dentro de transacción.

## 4.5 Validar `decision` en runtime

`src/actions/admin.ts:92` — los argumentos de una Server Action son input
controlado por el cliente; el tipo TS no existe en runtime. Pasar `"PENDING"`
pasa los guards y escribe un estado corrupto.

```ts
decision: z.enum(["VERIFIED", "APPROVED", "REJECTED"])
```
Igual para `setUserRole(userId, role)` con `z.enum(Role)`.

## 4.6 Nombres de índice

`SeniorApplication_userId` y `SeniorApplication_status` no llevan sufijo `_idx`,
los otros sí. Prisma compara **por nombre**, así que el próximo `migrate dev`
verá drift y generará un `DROP`+`CREATE` espurio. Renombrar antes de aplicar.

---

# Fase 5 — Base de datos ⚠️ REQUIERE DECISIÓN

**No se toca la base de datos de producción sin aprobación explícita.**

## Opción A — Staging primero (recomendada)

1. Crear un schema MySQL vacío de staging.
2. Aplicar baseline + migraciones ahí.
3. Correr el smoke test contra staging.
4. Solo entonces, producción.

## Opción B — Baseline read-only contra producción

```bash
mysqldump --no-data --skip-add-drop-table -h <host> -P 4000 -u <user> -p growcode \
  > prisma/migrations/00000000000000_baseline/migration.sql

# SANEADO OBLIGATORIO antes del MODIFY ... ENUM
SELECT status, COUNT(*) FROM SeniorApplication GROUP BY status;
SELECT role,   COUNT(*) FROM User              GROUP BY role;
```

Luego `npx prisma migrate resolve --applied 00000000000000_baseline`.
**Solo lee, no escribe.**

El segundo `SELECT` es el punto crítico: `SeniorApplication.status` era
`VARCHAR` libre. Si hay un valor fuera de `'PENDING','VERIFIED','APPROVED','REJECTED'`,
el `MODIFY ... ENUM` **falla** en modo estricto y la migración queda a medias
(la 1 aplicada, la 2 no). Hay que decidir el mapeo **antes** de la ventana de
deploy, no durante.

## Opción C — Congelar la base de datos

Arreglar solo código (Fases 0–4, 6–9) y dejar el schema sin aplicar hasta que
haya staging.

**Recomendación: A, con B como paso intermedio** para decidir el mapeo del enum.
B da la información que A necesita sin escribir nada.

## Riesgos que hay que nombrar

- **El DDL de TiDB es asíncrono y no bloquea escrituras** (a diferencia de
  MySQL, donde `MODIFY` de ENUM hace rebuild con `LOCK=SHARED`). Pero
  `migrate deploy` **no sabe cuándo terminó el job**: marca la migración como
  aplicada y sigue. Si el job falla después, `_prisma_migrations` miente.
  Verificar con `prisma migrate status` tras cada apply.
- **Las migraciones están sin commitear.** Si se hace push hoy, Vercel construye
  contra un `schema.prisma` que espera columnas que la BD no tiene. El build
  pasa (Prisma genera tipos desde el schema, no desde la BD) y el fallo aparece
  en producción. **Las migraciones se commitean en el mismo commit que el código
  que las necesita.**

---

# Fase 6 — Producto

> **Aviso como asesor.** El departamento de Producto escribió que *"la mentoría no
> es un producto, es un estado en una base de datos… es un link board con la
> palabra 'mentoría' en el hero"*. **Eso no es una tarea de ingeniería.**
> Arreglar los bugs hace que el flujo exista, pero la promesa central (sesión de
> mentoría, conversación) es un producto nuevo. Decidir si es el siguiente paso
> es decisión del CEO.

Lo que sí son bugs:

## 6.1 Guardados invisibles

`Bookmark` se guarda y **no hay ninguna vista** donde volver a verlo. El
usuario guarda un artículo y lo pierde para siempre. Crear `/guardados` + enlace.

## 6.2 Contador de mentorías equivocado

`profile/[id]/page.tsx:46` consulta `receivedRequests` y **nunca lo pinta**; la
estadística usa `sentRequests` (las que enviaste tú). Un mentor con 5 juniors
pidiéndole mentoría muestra "Mentorías: 0".

## 6.3 Sin listas de seguidores/seguidos

Solo contadores. Añadir `/profile/[id]/followers`.

## 6.4 Copy que promete lo que no existe

`apply-senior/page.tsx:29-36` promete "prioridad en búsquedas", "ranking de
mentores", "métricas exclusivas", "mayor visibilidad en el feed" y "beta tester
VIP". **Nada existe**: el filtro de mentores es client-side por palabra clave y
el feed ordena solo por fecha. `MentorsList` además anuncia "Spotlight del mes"
con un enlace "Ver ranking →" que va a una lista sin ranking.

**Recomiendo quitar las promesas** hasta que existan. Más barato que
construirlas y no cuesta credibilidad.

## 6.5 Onboarding huérfano

Nada redirige a `/onboarding` tras registrarse. El usuario entra al feed
directamente y nunca ve la pantalla. Añadir el redirect cuando
`!onboardingCompleted`.

## 6.6 Canales vacíos en el seed

El seed no asigna `channel`, así que todo cae en `general` y **10 de 11 canales
están vacíos**. Un usuario que entra a `#react` ve "Sé el primero en publicar aquí".

---

# Fase 7 — Accesibilidad

**Aviso.** Los "0 warnings de eslint" **no cubren accesibilidad**:
`eslint-config-next` no incluye reglas `jsx-a11y`. Añadirlo convierte la mayoría
de esto en errores automáticos.

## 7.1 Contraste · ALTO, el más extendido

~15 usos de `text-muted/20…/60`. Calculado sobre `--card: #0a0a0a`:

| Clase | Ratio | Mínimo AA |
|---|---|---|
| `/60` | 3.4:1 | 4.5:1 ❌ |
| `/50` | 2.7:1 | ❌ |
| `/40` | 2.1:1 | ❌ |
| `/30` | 1.66:1 | ❌ (ni no textual: 3:1) |
| `/20` | 1.34:1 | ❌ |

En tema claro los chips de estado también fallan (`text-amber-500` = 2.15:1,
`text-emerald-500` = 2.54:1). `--muted` a secas está bien (7.7:1 oscuro,
5.7:1 claro); el problema son las opacidades.

## 7.2 Resto

- `<label>` sin `htmlFor` en los formularios de auth → email y contraseña **sin
  nombre accesible**.
- Drawer de `FeedClient`: sin `role="dialog"`, sin focus trap, sin Escape. El
  teclado se pasea por detrás del overlay.
- 6 filtros de especialidad y el dropdown de orden sin `aria-pressed`/`aria-expanded`.
- Targets táctiles de 28–32px (mínimo recomendado 44px).
- `setUnreadCount` dentro de un updater de estado → en StrictMode el contador
  baja de más.
- Cero soporte de `prefers-reduced-motion`, con vídeo en autoplay y 80 tarjetas
  animadas.
- `eslint-plugin-jsx-a11y` al config.

---

# Fase 8 — Rendimiento

## 8.1 `/mentors` sin paginación

Carga **todos** los seniors. Con el seed actual (80) es scroll trabado en móvil
por `AnimatePresence mode="popLayout"` + `layout` en cada tarjeta. Desde ~300
seniors es un problema real. Es además la ruta **pública y sin caché**: la
superficie más fácil de amplificar.

Cursor pagination + mover búsqueda/filtro/orden al servidor (`searchParams`).

> **Hecho — con offset, no cursor.** La página enseña "Página 3 de 7" y el total
> de resultados ("1 Mentor en Back-end"), y eso no se calcula barato con un
> cursor. Paginación por `?page=N` con clamp, 12 por página, y `unstable_cache`
> con tag `mentors` (TTL 300). Medido: 737 ms en frío → 302 ms en caliente, con
> HTML idéntico en miss y en hit.
>
> **Trampa de `unstable_cache`:** la clave es `keyParts` + argumentos +
> `Function.toString()`. Un closure que captura `id` tiene el mismo `toString()`
> para todos los ids, así que el id hay que meterlo en `keyParts` si no se pasan
> argumentos. `tags` no forma parte de la clave.

## 8.2 Caché — diagnóstico corregido

`revalidatePath` **no es costoso** aquí: `/feed` usa `searchParams` y el resto
son `force-dynamic`, así que ninguna ruta está en Full Route Cache.
**El problema real es que no hay caché en absoluto.**

`revalidateTag` no arregla nada solo; hay que adoptar `unstable_cache` con tags.
Empezar por `/mentors` y `/post/[id]`, las dos rutas que lo toleran.

> **Hecho.** `src/lib/post-detail.ts`, tag `post:{id}` (el id va en `keyParts`),
> TTL 300, y `revalidatePost` llamado desde `revalidatePostViews`: sin eso, un
> like dejaba `/post/{id}` con el contador viejo. Medido: 1753 ms → 104 ms.
> `generateMetadata` reutiliza `getPost`, así que la ruta pasó de dos queries a una.
>
> **Trampa de Next 16:** `unstable_cache` serializa con `JSON.stringify`, así que
> un *miss* devuelve `Date` y un *hit* devuelve `string` ISO — hay que aceptar
> ambos. Y `revalidateTag(tag, perfil)` necesita dos argumentos; aquí se usa
> `revalidateTag(tag, { expire: 0 })`.

## 8.3 `.glass` es CSS inválido

`globals.css:105` — `rgba(var(--card), .7)` donde `--card` es un hex
(`#0a0a0a`). La declaración se descarta en el CSS compilado: el botón "Explorar
Mentores" no tiene fondo.

> **Hecho.** `color-mix(in srgb, var(--card) 70%, transparent)`: si resuelve
> `var()`, así que `--card` sigue siendo la única fuente de verdad. El
> `backdrop-filter` tampoco podía ir escrito a mano (Lightning CSS dejaba solo la
> variante `-webkit-`); se aplica con `backdrop-blur-*` de Tailwind en el
> elemento.

## 8.4 Rollback de `useOptimistic` inconsistente

Copiado en 3 sitios con 3 contratos distintos: `PostCard` lanza excepción,
`FollowButton` y `RoadmapClient` devuelven `{error}`. En `/post/[id]` el
`revalidatePath` no cubre la ruta actual → **el like se pone y al terminar se
revierte visualmente, aunque la BD sí lo guardó**.

`FollowButton` es el único correcto (estado local + respuesta del servidor).
Unificar los tres a ese patrón.

> **Hecho.** Los tres usan el patrón de `FollowButton` y `revalidatePostViews`
> cubre ahora `/post/[id]` vía `revalidatePost`. El regreso del scroll y del
> foco en `/feed` se dejó en `AnimatePresence` solo donde hay pocas tarjetas.


---

# Fase 9 — Limpieza

- **Código muerto**: `listSeniorApplications` y `isAdmin` (solo los usan tests;
  la página consulta Prisma directo), `formatCount` y `HomeStats` exportados
  sin uso.
  **Hecho.** Las dos primeras se borran; las dos ultimas dejan de exportarse
  (`HomeContent` las usa, nadie mas).
- **`next.config.ts`**: `remotePatterns` obsoletos (dicebear, githubusercontent,
  localhost) — obsoletos desde que los avatares van `unoptimized`.
  **Hecho, y al limpiarlo apareció un bug de producción:** `AccountMenu` no
  usaba `UserAvatar` sino su propio `<Image>` **sin `unoptimized`**. Con GitHub
  OAuth, `User.image` es `avatars.githubusercontent.com`, que no estaba en
  `remotePatterns`: `next/image` lanza al renderizar y cae la página entera.
  Ahora `AccountMenu` usa `UserAvatar` y `remotePatterns` desaparece entero.
- **Seed**: no cubre `SeniorApplication`, `RoadmapProgress`, notificaciones ni
  comentarios. Con datos reales, la app parece rota en desarrollo
  (notificaciones vacías, contadores a 0, mentoría sin histórico).
- **`sitemap` vs `robots` se contradicen**: el sitemap anuncia `/post/*` y
  `/profile/*`; `robots` prohíbe `/profile/`.
- **OG image**: `openGraph.images` y `twitter.images` apuntaban a
  `brand-dark.jpg`, que es **1408×768** (no 1200×800) y pesa 665 KB → ratio
  incorrecto para OG. **Hecho:** `public/og.jpg`, 1200×630, recorte centrado del
  mismo asset, 85 KB.
- **`themeColor`**: el dark declaraba `#0a0a0a`, que es `--card`, no
  `--background` (`#020202`). **Hecho.**
- **Tipografía**: `body` declaraba `Inter`, que nunca se cargaba; la app se
  dibujaba con la fuente del sistema mientras los woff2 de Geist viajaban sin
  usarse. **Hecho** (`body` → `var(--font-geist-sans, …)` más `--font-sans` /
  `--font-mono` en `@theme inline`), verificado con `scripts/probe-fonts.mjs`.
- **Historia de git**: el cliente Prisma generado pesa 58 MB (los tres motores
  nativos: 21 MB + 17,5 MB + 17,5 MB).
  **Medido, y el diagnóstico original estaba mal:** no están en `HEAD` —los borró
  `3ec3768`— pero **sí en `origin/main`**, que es lo publicado en GitHub (60
  ficheros). `.git` pesa 31,3 MB.
  Purgarlos exige `git filter-repo --invert-paths src/generated-v2` **y
  force-push**: reescribe todos los SHAs y obliga a re-clonar. Además hay **tres
  clones más de este repo en el mismo disco**, uno de ellos con la app Expo.
  **Descartado:** ~20 MB en un repo a 1 GB de límite, con impacto funcional cero.
  La higiene ya está resuelta hacia adelante. Revisar solo si molesta de verdad.

## Hallazgos nuevos de la verificación (preexistentes, no regresiones)

- **El `<title>` sale después de `</head>`.** En rutas con `generateMetadata`
  dinámico + `loading.tsx`, cuando la caché está fría el `<title>` aparece
  dentro de `<body>`. Reproducido también en `/profile/[id]`, que no usa
  `unstable_cache`, así que no lo ha causado la fase 8. El procesador HTML de
  Chrome aplica las reglas de *in-head* a un `<title>` en body, así que funciona
  igual; queda pendiente en el ámbito de metadata/SEO de esta fase.
- **`sitemap` y `robots` se contradicen** (ya anotado arriba).
- **`scripts/a11y-audit.mjs` no necesita `public/axe.min.js`.**
  `addScriptTag({ path })` lee el fichero de disco, así que ahora busca en
  `node_modules/axe-core/`; antes la instrucción era copiar 564 KB a `public/`,
  que el deploy publicaría.


---

# Lo que NO se hará sin aprobación explícita

- **Refactor de `select.ts` a mappers explícitos.** Correcto en teoría
  (el compilador protegería la frontera), pero es una refactorización grande
  sobre un proyecto ya estable. Anotado para más adelante.
- **`prettier` / formateo masivo.** Ruido en el diff, cero valor.
- **Tests de integración completos con MySQL en Docker.** Los mocks funcionan y
  corren en 1,2 s. El valor está en cubrir las acciones sin test, no en levantar infra.
- **Cobertura como métrica.** Con 23% sobre código sin testear, un número alto
  engaña más que informa.

---

# Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| Romper algo que funciona | Cada fase tiene verificación propia; Fase 1 es de una línea por cambio |
| Perder datos en la BD | **No se aplica nada sin OK explícito.** Fase 5 es read-only hasta que se diga |
| Smoke test frágil | Corre contra server local con BD desechable, exit code 1 |
| Romper Vercel al subir | Las migraciones se commitean **junto** al código que las necesita |
| Que 33 h sean demasiado | Fases 0–2 (6 h) dejan la app usable; el resto es cortable |

---

# Las 5 decisiones pendientes

| # | Decisión | Recomendación |
|---|---|---|
| 1 | **Base de datos**: staging primero, baseline read-only, o congelar | Staging, con baseline read-only para decidir el mapeo del enum |
| 2 | **Perfiles públicos**: ¿sí o solo logueados? | Sí, públicos (coherente con `/mentors` ya público) |
| 3 | **Rate limiting**: Upstash (gratis) o Vercel Pro | Upstash Ratelimit |
| 4 | **Revocación de rol**: releer BD, `version`, o documentar retardo | Reloader de BD con TTL de 5 min |
| 5 | **`feed/new`**: `useActionState` o seguir por URL | `useActionState` |

**Arranque recomendado: Fase 0 + Fase 1 (≈4 h).** Con eso la app funciona, el
smoke test lo demuestra, y CI evita que vuelva a romperse.

No avanzar a Fase 5 sin respuesta a la decisión 1.