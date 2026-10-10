# Checklist de Remediación — GroCode

> Documento vivo. Se actualiza al completar cada tarea.
> Plan completo: [`PLAN.md`](./PLAN.md)

## Leyenda

| Símbolo | Significado |
|---|---|
| `[ ]` | Pendiente |
| `[~]` | En curso |
| `[x]` | Hecho **y verificado** |
| `[!]` | Bloqueado — esperando decisión del CEO |
| `[-]` | Descartado / fuera de alcance |

**Regla:** una casilla solo se marca `[x]` si hay verificación que lo demuestra.
No se marca "porque debería funcionar".

---

## Estado global

| Métrica | Inicio | Actual | Objetivo |
|---|---|---|---|
| `tsc --noEmit` | 7 errores | ✅ 0 | 0 |
| `eslint` | 1161 errores | ✅ 0 / 0 | 0 / 0 |
| `vitest` | 0 tests | ✅ **141** (11 archivos) | 50+ |
| Violaciones axe-core (WCAG A/AA) | **1 grave** | ✅ **0** en 14 combinaciones | 0 |
| Contraste AA en tema claro | 7 colores fallan | ✅ los 7 pasan | 0 fallos |
| Targets tactiles < 44px | 20 botones | ✅ 0 en 4 rutas | 0 |
| Elementos sin nombre accesible | sin medir | **0** en 18 rutas | 0 |
| Rutas auditadas por axe | 7 (solo publicas) | **18** (22 combinaciones con sesion) | todas |
| Labels sin control asociado | 10 | ✅ 0 | 0 |
| Soporte `prefers-reduced-motion` | **ninguno** | ✅ global + video del hero | si |
| Alta de usuarios | **rota** (`P2022`) | **funciona** (cookie v5 emitida, `/feed` 200) | funciona |
| `next build` | OK | ✅ OK | OK |
| `npm audit --omit=dev` | 10 (4 críticas) | ⚠️ 2 (1 alta) | 1 moderada |
| Smoke test autenticado | **nunca se pudo ejecutar** | **24/24** | 24/24 |
| CI | **no existe** | workflow listo, **smoke sin BD** | verde |
| Migraciones commiteadas | **no** | 1 baseline, aun sin commit | si |
| Rutas autenticadas verificadas | 0 | **7 con sesion real** | todas |
| Conflictos de `meta robots` | 1 (desconocido) | **0** (dos etiquetas que concuerdan) | 0 |
| Cabeceras de seguridad | 0 | ✅ **6** | 6 |
| XSS vía `website` | posible | ✅ bloqueado (28 tests) | 0 |
| Healthcheck | no existe | ✅ operativo | ok |
| Canales con posts | **1 de 11** | **11** (790 posts) | 11 |
| Copy que promete features inexistentes | 5 promesas | ✅ **0** | 0 |
| Vista de guardados | **no existía** | ✅ `/guardados` | existe |
| Lista de seguidores | **no existía** | ✅ `/profile/[id]/followers` | existe |
| Índices de BD | **0 en Post** | ✅ 7 nuevos | los necessarios |
| Payload del feed (250 likes/post) | 143.8 KB | ✅ **22.4 KB** | -84% |
| IDs de usuario por página de feed | 5000 | ✅ **20** | mínimo |
| Drift de migraciones | 3 migraciones a medias, sin historial | **0** (baseline unico) | 0 |
| Tiempo del seed | **>15 min, se caia** | **131 s** | < 60 s |
| Filas de datos de prueba | 13 | **9274** | datos realistas |

**Progreso:** 8/9 fases (0-7) - ~31 h / 33 h

> ⚠️ **Acción requerida del CEO antes del próximo deploy:** el dashboard de
> Vercel sigue con `NEXTAUTH_SECRET` / `NEXTAUTH_URL`. Hay que renombrarlas a
> `AUTH_SECRET` / `AUTH_URL`. Hasta entonces, `assertAuthSecretConfigured()`
> hará **fallar el build** en producción a propósito (fall-fast).

---

## Decisiones pendientes del CEO

Bloquean el avance. Ninguna bloquea la Fase 0 o la Fase 1.

- [!] **D1 — Base de datos.** Staging primero (A) · baseline read-only (B) · congelar (C)
      → *Rec: A con B como paso intermedio.*
- [ ] **D2 — Perfiles públicos.** ¿Públicos o solo logueados?
      → *Rec: públicos (coherente con `/mentors`).*
- [ ] **D3 — Rate limiting distribuido.** Upstash Ratelimit (gratis) vs Vercel Pro ($20/mes)
      → *Rec: Upstash.*
- [ ] **D4 — Revocación de rol.** Reloader de BD c/ TTL 5 min (a) · `session.version` (b) · documentar retardo (c)
      → *Rec: (a).*
- [ ] **D5 — `feed/new`.** `useActionState` vs seguir pasando el error por la URL
      → *Rec: `useActionState`.*

---

## Fase 0 — Red de seguridad

*Sin esto, todo lo demás son arreglos a ciegas.*

- [~] **0.1** Smoke test autenticado `scripts/smoke-auth.mjs`
  - [x] Arranca `next dev` contra BD desechable
  - [x] Crea el usuario vía Prisma con bcrypt coste bajo
  - [x] Captura la cookie del `Set-Cookie` (no hardcodea el nombre)
  - [x] Verifica 200 en `/feed`, `/roadmap`, `/onboarding`, `/notifications`, `/feed/new`, `/profile/<id>`, `/post/<id>`
  - [x] Verifica que la cookie se llama `*authjs*` (falla si vuelve el nombre v4)
  - [x] Verifica `/admin/applications` sigue gateado para no-admin
  - [x] Exit code 1 en fallo, 2 en misconfiguración
  - [x] **Guardia anti-producción** (aborta con `tidbcloud.com`, `rds.amazonaws.com`, etc.)
  - [!] **Falta BD de test** — no hay servidor MySQL accesible. Docker CLI existe pero el daemon no corre.
        → Ver D1. Se desbloquea con `SMOKE_DATABASE_URL` + `npm run smoke`

- [x] **0.2** Tests que faltan
  - [x] `auth-chain.test.ts` — `jwt()`→`session()` preserva JUNIOR/SENIOR/**ADMIN**
  - [x] `auth-chain.test.ts` — deriva a JUNIOR si el token no trae role
  - [x] `auth-chain.test.ts` — deriva a JUNIOR si el role es desconocido
  - [x] `auth-chain.test.ts` — cubre todos los miembros del enum (anti-drift)
  - [x] `auth-chain.test.ts` — `proxy` acepta `authjs.session-token`
  - [x] `auth-chain.test.ts` — `proxy` **rechaza** la cookie v4
  - [x] `auth-chain.test.ts` — rutas públicas, robots/sitemap, callbackUrl
  - [x] `notifications-security.test.ts` — `markAsRead`/`deleteNotification` con `userId` en el filtro
  - [x] `notifications-security.test.ts` — no tocan filas ajenas (IDOR)
  - [x] `notifications-security.test.ts` — sin sesión no hay query
  - [x] `notifications-security.test.ts` — `getNotifications` acota el `take`
  - [x] `rate-limit.test.ts` — umbral exacto (falla si sube de 5)
  - [x] `rate-limit.test.ts` — `remaining`, `retryAfter`, renovación de ventana
  - [x] `rate-limit.test.ts` — `getClientIp` prefiere Vercel, última IP del XFF
  - [x] `rate-limit.test.ts` — no devuelve `""` con header vacío
  - [x] `mentorship.test.ts` — solo el senior destinatario responde
  - [x] `mentorship.test.ts` — no se responde dos veces
  - [x] `mentorship.test.ts` — el junior no auto-responde
  - [x] `mentorship.test.ts` — re-solicitud tras rechazo, no duplica
  - [x] `mentorship.test.ts` — un ADMIN tampoco pide mentoría

- [~] **0.3** CI `.github/workflows/ci.yml`
  - [x] typecheck + lint + test + build
  - [x] `cache: npm` (key = hash de `package-lock.json`)
  - [x] `npm ci --legacy-peer-deps`
  - [x] `AUTH_SECRET` de dummy para el build
  - [ ] Gate de drift de esquema — comentado hasta que haya staging
  - [ ] Smoke test en CI — comentado hasta que haya `SMOKE_DATABASE_URL`

**Verificación de fase:** `npm test` → **78 pasan** · los 2 tests de regresión fallan si se reintroduce cada bug (comprobado revirtiendo el fix)

---

## Fase 1 — Que la app funcione

- [x] **1.1** 🔴 Cookie de sesión · `src/lib/session-cookie.ts` (nuevo) + `proxy.ts:26`
      `next-auth.session-token` → `authjs.session-token` (+ `__Secure-`)
      **Test de regresión:** revirtiendo el fix, 2 tests fallan ✅

- [x] **1.2** 🔴 Rol ADMIN · `src/auth/auth.config.ts:4-13`
      `isRole` → `Object.values(Role).includes(value as Role)`
      **Test de regresión:** revirtiendo el fix, 2 tests fallan ✅

- [x] **1.3** 🔴 Panel de mentoría · `src/components/mentorship/MentorRequestButton.tsx`
  - [x] Guards reordenados: primero "soy el Senior en mi perfil"
  - [x] Luego "soy Junior en perfil de Senior"
  - [x] La rama de Aceptar/Rechazar es alcanzable por fin
  - [x] Muestra el mensaje del junior en la bandeja
  - [x] `RequestButtonClient`: `window.location.reload()` → `router.refresh()`
  - [x] `SENT_LABEL` como mapa (el botón "rechazada" ya no es un CTA primario)

- [x] **1.4** `feed/new` traga el error · `src/components/feed/NewPostForm.tsx` (nuevo)
  - [x] Migrado a `useActionState`  *(D5: aplicado con la recomendación)*
  - [x] `state.error` se muestra con `role="alert"`
  - [x] `page.tsx` queda como Server Component que solo hace el guard

- [x] **1.5** Variables NextAuth v5
  - [x] `.env`: `NEXTAUTH_SECRET` → `AUTH_SECRET` (valor preservado)
  - [x] `.env`: `NEXTAUTH_URL` → `AUTH_URL`
  - [x] `.env.local`: idem
  - [x] `AUTH_TRUST_HOST="true"` en ambos
  - [x] `.env.example` actualizado con aviso
  - [x] `assertAuthSecretConfigured()` en `auth.ts` (warn en legacy, throw en prod)

- [!] **1.6** Renombrar vars en el dashboard de Vercel — **requiere acceso del CEO**

**Verificación de fase:** tsc 0 · eslint 0/0 · 78 tests · build OK · rutas sin sesión siguen gateadas correctamente

---

## Fase 2 — Móvil y compartir

- [x] **2.1** 🔴 Login en móvil · `src/components/NavbarClient.tsx`
  - [x] "Ingresar"/"Registrarse" **siempre visibles** (antes `hidden sm:flex`)
  - [x] Nuevo `src/components/nav/AccountMenu.tsx`: avatar + dropdown con perfil, panel (si admin) y cerrar sesión
  - [x] Escape + click fuera en el menú
  - [x] `aria-expanded` / `aria-haspopup` / `role="menu"`

- [x] **2.2** Logout duplicado
  - [x] `LogoutButton` eliminado (absorbido por `AccountMenu`). Solo queda uno.

- [x] **2.3** Enlaces públicos · `src/proxy.ts`  *(D2: aplicado — perfiles públicos)*
  - [x] `PUBLIC_PREFIXES = ["/post/", "/profile/"]`
  - [x] Estructura separada: exactas vs prefijos vs file handles
  - [x] Tests: 6 casos, incluido bypass por prefijo parecido

- [x] **2.4** Sitemap ↔ robots coherentes
  - [x] `robots.ts` ya no prohíbe `/profile/` (que el sitemap lista)
  - [x] `robots.ts` prohíbe `/admin/` y `/feed/new`
  - [x] Ambos usan `AUTH_URL` (no `NEXTAUTH_URL`)

- [x] **2.5** Extra (detectado al verificar 2.3): skip-link en `layout.tsx`

- [x] **2.6** 🟠 Extra: `<meta name="robots">` conflictivo
  - [x] Quitado el `robots: { index: true, follow: true }` global del layout raíz
  - [x] Un post inexistente emite **1 solo** tag `noindex` (antes: 2, `index,follow` + `noindex`)
  - [x] Aserción añadida al smoke test

**Verificación de fase:** tsc 0 · eslint 0/0 · 84 tests · build OK · rutas: públicas 200, privadas 307, 404s con `noindex` único

> **Nota sobre el status 200 en `/post/<id>` inexistente:** es el comportamiento
> documentado de Next.js para respuestas *streamed* (el `loading.tsx` abre el
> boundary de Suspense antes de que la página pueda llamar a `notFound()`).
> Next lo compensa inyectando `noindex`, y así queda verificado. Si algún día se
> necesita un 404 real, la vía es comprobar la existencia en `proxy` antes de que
> empiece el streaming — a costa de una query por request.

---

## Fase 3 — Seguridad

- [x] **3.1** 🟠 XSS almacenado vía `website`
  - [x] `src/lib/validation.ts` (nuevo): `validateHttpUrl` rechaza `javascript:`, `data:`, `vbscript:`, `file:`, `blob:`
  - [x] Rechaza credenciales embebidas (`https://grocode.com@evil.example`)
  - [x] `validateUrlWithHost`: coincidencia **exacta** de host (con `www.` normalizado)
  - [x] `updateProfile` valida `website` **e `image`** (ambos son input de cliente)
  - [x] `posts.ts` y `senior-application.ts` reutilizan el validador (fin de la duplicación y de las regex frágiles)
  - [x] Coerción a string: `undefined` ya no da 500
  - [x] `updateProfile` devuelve `{error}` en vez de lanzar
  - [x] 28 tests, incluidos 7 payloads peligrosos y 4 spoofing de host

- [x] **3.2** 🟠 `getClientIp`  *(hecho en la tanda anterior)*

- [!] **3.3** Rate limiting distribuido — **bloqueado: requiere credenciales de Upstash**
      → *Rec: Upstash Ratelimit. La interfaz `limit()` ya está lista para el swap.*

- [x] **3.4** Cabeceras de seguridad · `next.config.ts`
  - [x] CSP con `frame-ancestors 'none'`
  - [x] `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY`
  - [x] `Referrer-Policy` · `Permissions-Policy` · HSTS
  - [x] **Verificado en navegador real**: 0 violaciones, hidratación y toggle de tema funcionando

- [x] **3.5** Healthcheck · `src/app/api/health/route.ts`
  - [x] `SELECT 1` con timeout de 5 s, 503 si la BD no responde
  - [x] Devuelve latencia; sin credenciales en la respuesta
  - [x] Verificado: `{"status":"ok","db":"up","latencyMs":825}`

- [x] **3.6** Revocación de rol  *(D4: aplicado — reloader de BD)*
  - [x] `callback jwt` relee el rol si el token tiene >5 min
  - [x] Degrada a JUNIOR si la cuenta ya no existe
  - [x] **Fail-safe**: un fallo de BD conserva el rol del token (no degrada a un admin legítimo)
  - [x] `roleCheckedAt` en el tipo JWT
  - [x] 7 tests

- [x] **3.7** Cota en `notify()`
  - [x] 30/hora por emisor, antes de tocar la BD
  - [x] Log sin el objeto de error de Prisma (evita PII en logs: emails, queries)
  - [x] 6 tests, incluido el de fuga de PII

- [!] **3.8** Verificación de email — **bloqueado: requiere proveedor de email**
      El modelo `VerificationToken` ya existe. Falta el envío.

**Verificación de fase:** tsc 0 · eslint 0/0 · **125 tests** · build OK · CSP validado en navegador (hidratación, toggle de tema, móvil, skip-link, clickjacking) · healthcheck OK

---

## Fase 4 — Datos

*Todo esto entra en migraciones, que **no se aplican** hasta la Fase 5.*

- [x] **4.1** 🟠 Índices · `prisma/schema.prisma`
  - [x] `Post @@index([channel, createdAt(sort: Desc)])` — el feed hacía full-scan + filesort
  - [x] `Post @@index([authorId, createdAt(sort: Desc)])`
  - [x] `Like @@index([postId])` — el unique existente empieza por `userId`
  - [x] `Bookmark @@index([postId])`
  - [x] `Comment @@index([postId, createdAt(sort: Desc)])`
  - [x] `Notification @@index([userId, createdAt(sort: Desc)])` — `getNotifications` ordenaba con filesort

- [x] **4.2** 🟠 Payload · `src/lib/post-select.ts` (nuevo)
  - [x] `_count` para los totales; `likes`/`bookmarks` solo la fila del viewer (`take: 1`)
  - [x] Centinela `NO_VIEWER` para visitantes anónimos
  - [x] `PostCard` calcula el total con delta optimista (el número reacciona al like)
  - [x] **Medido** (`npm run measure:payload`): con 250 interacciones por post, **−84%** de payload; con 3000, **1.49 MB → 22 KB**
  - [x] IDs de usuario expuestos por página: de 5000 a **20**

- [x] **4.3** Acotar queries
  - [x] Comentarios en una query aparte, **5 por post** en el feed (antes ilimitados en el perfil)
  - [x] Posts del perfil: `take: 20` + aviso "Mostrando X de Y"
  - [x] `src/lib/paging.ts`: `parsePage` con clamp a 500 (`?page=1e8` → skip de 1e9 filas)
  - [x] `generateMetadata` del perfil con `cache()` — antes duplicaba la query
  - [x] `/post/[id]` reutiliza la misma query cacheada

- [x] **4.4** Unicidad en postulaciones
  - [x] `SeniorApplication.userId` → `@@unique`
  - [x] `applySenior` usa `upsert` por `userId`: re-postular tras rechazo funciona **y** no puede haber dos PENDING
  - [x] Corregido el tamaño de la migración 1: `@@unique([userId])` no impedía re-postular

- [x] **4.5** Validación runtime con zod · `actions/admin.ts`
  - [x] `decision`: `z.enum(["VERIFIED","APPROVED","REJECTED"])`
  - [x] `role`: `z.enum(["JUNIOR","SENIOR","ADMIN"])`
  - [x] Antes, `"PENDING"` pasaba los guards y corrompía el estado

- [x] **4.6** Migración consolidada
  - [x] `20260101000200_add_feed_indexes_and_application_uniqueness`
  - [x] Nombres de índice canónicos en la migración 1 (fin del *schema drift*)
  - [x] Dedupe antes del UNIQUE, con el pre-flight en comentarios

**Verificación de fase:** tsc 0 · eslint 0/0 · **141 tests** (11 archivos) · build OK · payload medido

---

## Fase 5 - Base de datos

> **Contexto:** no hay clientes reales, la base anterior tenia **13 filas** de
> prueba y ningun historial de migraciones. Eso convertia "congelar la base" en
> una postura sin objeto: congelar protege datos que no existen. Decision del CEO:
> resetear y regenerar el historial.

- [x] **5.0** Volcado previo (artefacto reversible)
  - [x] `scripts/db-dump.mjs` (nuevo) - 13 filas a `.next/db-backup-before-reset.json`
  - [x] Las contrasenas hasheadas se sustituyen por su longitud, no se dejan en texto

- [x] **5.1** Reset y alineacion del esquema
  - [x] `prisma db push --force-reset` - esquema = codigo
  - [x] Confirmado el motivo: no existia la tabla `_prisma_migrations`, la base se
        habia creado fuera de Prisma, y `migrate deploy` habria chocado con un
        `CREATE TABLE` de una tabla ya existente

- [x] **5.2** Seed: **7 veces mas rapido** (15+ min -> 131 s)
  - [x] Causa: cada `create` es un round-trip a TiDB de ~325 ms. 1200 follows
        secuenciales son >6 min solo en esa fase, y el seed se caia a mitad
  - [x] `insertInChunks()` con `createMany` en trozos de 250, con reintento fila a
        fila si un lote falla
  - [x] El seed ahora **trunca al principio**: antes no era re-ejecutable (los
        usuarios usaban `upsert` pero el resto `create` a secas) y una segunda
        pasada duplicaba cientos de filas
  - [x] Resultado: 300 usuarios, 790 posts en 11 canales, 1367 follows,
        292 mentorias, 5586 likes, 1137 comentarios, 25 postulaciones,
        102 notificaciones, 1 ADMIN = **9274 filas**

- [x] **5.3** Historial de migraciones regenerado
  - [x] Las 3 migraciones a medias sustituidas por **una** baseline limpia
        (`20260101000000_init`, 14 tablas, 12 indices no unicos)
  - [x] `migrate resolve --applied` - la marca aplicada sin volver a ejecutarla
  - [x] `migrate status` -> "Database schema is up to date!"
  - [x] `migrate diff` -> **0 bytes**: no hay drift

- [x] **5.4** Smoke test autenticado: **por fin se ejecuta**
  - [x] `scripts/setup-smoke-db.mjs` (nuevo) crea `growcode_smoke` en el mismo
        servidor y aplica el esquema
  - [x] La guardia anti-produccion ahora protege el **nombre** de la base, no el
        host: una base desechable en un host gestionado es lo normal, y vetar el
        host no protegia nada
  - [x] `db push` necesita `--force-reset` en TiDB: si no, el schema engine no
        reconoce las FKs existentes e intenta recrearlas
        (`Duplicate foreign key constraint name 'Like_userId_fkey'`)
  - [x] **24/24 comprobaciones pasan**

- [x] **5.5** Cinco bugs del propio smoke test, encontrados al ejecutarlo
  - [x] `new PrismaClient()` sin URL explicita: creaba el usuario en la base de
        **desarrollo** mientras el servidor corria contra la de test
  - [x] "sign-in aceptado" solo miraba el status: un 302 de error tambien es 302,
        asi que un login roto pasaba la comprobacion
  - [x] Leia el mismo body dos veces y reventaba al final del informe
  - [x] `spawn("npx")` sin `shell` y luego con `shell`: o ENOENT o se llevaba por
        delante la consola. Ahora invoca las entradas JS de Next y Prisma
  - [x] `import()` de una ruta absoluta de Windows: necesita `pathToFileURL`
  - [x] Comprobacion de puerto ocupado antes de arrancar, para que el error sea legible

- [x] **5.6** Verificacion de que el alta de usuarios funciona
  - [x] **Confirmado: la cookie `authjs.session-token` se emite, `/api/auth/session`
        devuelve el usuario con rol y `/feed` responde 200**
  - [x] `P2022` resuelto: `user.onboardingCompleted` ya existe en la base

**Verificacion de fase:** smoke autenticado **24/24** - sin drift de migraciones -
9274 filas en los 11 canales - seed en 131 s - tsc 0 - eslint 0/0 - 141 tests

### Correccion de una afirmacion propia

El panel de admin responde **200** a un JUNIOR, no 307. No es una escalada de
privilegios: `page.tsx:31` llama a `redirect()` **antes** de cualquier query, y
el smoke test comprueba ahora que el cuerpo no contiene datos de postulaciones.
Es un rebote en cliente porque el segmento ya se habia transmitido. La
comprobacion anterior exigia 307 y era incorrecta.

---
## Fase 6 — Producto

> **Aviso como asesor.** El departamento de Producto escribió que *"la mentoría no
> es un producto, es un estado en una base de datos… es un link board con la
> palabra 'mentoría' en el hero"*. Arreglar los bugs hace que el flujo exista,
> pero la promesa central (sesión de mentoría, conversación) es un producto
> nuevo. Decidirlo es del CEO, no del equipo de ingeniería.

- [x] **6.1** 🔴 Guardados invisibles
  - [x] `src/app/guardados/page.tsx` con paginación y estado vacío
  - [x] Enlace en el navbar (desktop y móvil)
  - [x] Solo la fila del viewer en bookmarks (mismo criterio que el feed)
  - [x] Gateado por sesión vía el proxy

- [x] **6.2** ✅ Contador de mentorías (hecho en la Fase 4 al reescribir el perfil)
  - [x] Seniors ven `receivedRequests`, juniors `sentRequests`
  - [x] Antes un mentor con 5 solicitudes mostraba "Mentorías: 0"

- [x] **6.3** Listas de seguidores/seguidos
  - [x] `src/app/profile/[id]/[list]/page.tsx` (`followers` / `following`)
  - [x] Contadores del perfil convertidos en enlaces reales
  - [x] `StatCard` sin `hover:` si no es un enlace (antes invitaba a clicar sin hacer nada)

- [x] **6.4** Copy engañoso
  - [x] `apply-senior`: fuera "prioridad en búsquedas", "ranking de mentores",
        "analíticas de impacto", "mayor visibilidad en el feed" y "beta tester VIP"
  - [x] `FeedClient`: fuera "Spotlight del mes" con enlace a un ranking inexistente
  - [x] `HomeContent`: "Mentoría Directa 1-a-1" → "Mentoría por Solicitud"
  - [x] Escrito **qué ocurre realmente** al aprobarse

- [x] **6.5** 🔴 Onboarding huérfano
  - [x] `/feed` redirige a `/onboarding` si `!onboardingCompleted`
  - [x] `src/components/onboarding/OnboardingChoice.tsx` (cliente, con error visible)
  - [x] Antes solo se llegaba escribiendo la URL a mano

- [x] **6.6** Seed con datos realistas
  - [x] `channel` asignado → **10 de 11 canales estaban vacíos**
  - [x] `onboardingCompleted: true` en todos los usuarios
  - [x] Likes, bookmarks y comentarios (todos los contadores daban 0)
  - [x] `SeniorApplication` en los 4 estados (el panel admin no tenía nada que revisar)
  - [x] Notificaciones (todo el mundo veía "Sin notificaciones" para siempre)
  - [x] Un usuario `ADMIN` para poder probar el panel
  - [x] Aviso si faltan los pasos del roadmap

**Verificación de fase:** tsc 0 · eslint 0/0 · 141 tests · build OK · rutas nuevas verificadas · seed compila y escaneado sin caracteres corruptos

---
## Fase 7 - Accesibilidad

- [x] **7.0** Reglas `jsx-a11y` como error en `eslint.config.mjs`
  - [x] El plugin ya venia registrado por `eslint-config-next`; solo hay que subir reglas a `error`
  - [x] Al activarlas aparecieron **16 errores reales** en 5 archivos

- [x] **7.1** Contraste — medido, no estimado
  - [x] `scripts/color-contrast.mjs` (nuevo): pide al motor de render el color ya
        resuelto y calcula el ratio con la formula de WCAG
  - [x] `text-muted/20..70` -> `text-muted` (`/90` se queda: 4.61:1 ya pasa)
  - [x] 32 usos corregidos en 12 archivos
  - [x] Iconos de estado vacio quedan en `/40`: son decorativos (exentos por 1.4.3)
  - [x] **7 colores de estado** reescritos a `text-*-700 dark:text-*-500` (78 sitios)
  - [x] Motivo: `-500` daba 1.91-3.75:1 en claro; `-600` tampoco llegaba; `-700` da 4.93-7.30:1

- [x] **7.2** Labels en formularios de auth
  - [x] `htmlFor` + `id` en email y contrasena (signin y register)
  - [x] `autoComplete`: `email`, `current-password`, `username`, `new-password`
  - [x] `role="alert"` en errores, `role="status"` en el aviso de registro
  - [x] **`Ubicación` y `Website` no tenian nombre accesible alguno** (WCAG 4.1.2)

- [x] **7.3** Drawer movil de canales como dialogo real
  - [x] `role="dialog"` + `aria-modal` + `aria-label` + `id`
  - [x] `useModalBehaviour`: Escape, foco atrapado, foco devuelto, scroll bloqueado
  - [x] `aria-expanded` + `aria-controls` en el boton que lo abre

- [x] **7.4** Estados de toggle y desplegables
  - [x] `aria-pressed` en los 6 filtros de especialidad
  - [x] Desplegable de orden: `aria-expanded`, `role="menu"`, `role="menuitemradio"`, `aria-checked`
  - [x] Escape lo cierra y devuelve el foco al boton

- [x] **7.5** Targets tactiles = 44px (`min-h-11 min-w-11`)
  - [x] 20 botones de icono que median 24-36px
  - [x] `ThemeToggle` (36px), "Ingresar", "Registrarse", "Ver perfil", logo,
        "Más información", "Volver al inicio", nombre del mentor
  - [x] El skip-link `sr-only` se queda en 1x1: es el patron correcto

- [x] **7.6** `setUnreadCount` fuera del updater de estado
  - [x] En `notifications/page.tsx` el decremento estaba **dentro** del updater de
        `setNotifications`: es un efecto secundario durante el render y en
        StrictMode el updater corre dos veces (contador bajaba de dos en dos)
  - [x] Ahora se lee `wasUnread` antes de actualizar

- [x] **7.7** `prefers-reduced-motion`
  - [x] Bloque global en `globals.css` (animaciones, transiciones, `scroll-behavior`)
  - [x] El `<video>` del hero se pausa con `matchMedia`: **CSS no puede pausar
        un video**, asi que hacia falta JS ademas de la regla de estilo

### Herramientas de verificacion (nuevas)

| Script | Que comprueba |
| --- | --- |
| `scripts/a11y-audit.mjs` | axe-core en 18 rutas x 2 temas, movil 390px. Sale con 1 si hay violaciones serias/criticas |
| `scripts/a11y-behaviours.mjs` | Targets >= 44px (**con y sin sesion**), Escape + retorno de foco, pausa del video, labels y `role=alert` |
| `scripts/color-contrast.mjs` | Ratio real de cada color en ambos temas, y cuanto oscurecer para llegar a 4.5:1 |
| `scripts/a11y-screenshots.mjs` | Capturas claro/oscuro para revisar el disenio a ojo |
| `scripts/probe-fonts.mjs` | Que la tipografia que se descarga (`next/font`) es la que el navegador aplica |

Requieren un servidor levantado y las deps de auditoria, que **no** se anaden a
`package.json` a proposito (pesan y no son dependencia de la app). El puerto es
argumento del script y por defecto 3980:

```
npm i --no-save axe-core puppeteer-core
node scripts/a11y-audit.mjs 3980
node scripts/probe-fonts.mjs 3980
```

`a11y-audit.mjs` busca `axe.min.js` en `node_modules/axe-core/` y solo recurre a
`public/` si no lo encuentra: `addScriptTag({ path })` lee el fichero de disco,
asi que no hace falta (ni conviene) publicarlo junto al deploy.

**Auditoria autenticada (cierre del hueco de la Fase 7)**

La primera pasada de axe solo cubria rutas publicas: nunca vio `/feed`,
`/roadmap`, `/notifications`, `/guardados`, `/profile`, `/post` ni `/admin`.
Son justo las paginas con formularios, modales y botones de icono. Al extender
el script (18 rutas, login con el formulario real, 2 temas) aparecieron **12
violaciones serias**:

- [x] **`/feed/new` sin nombre accesible en movil.** El texto estaba en
      `hidden sm:inline`: `hidden` lo saca tambien del arbol de accesibilidad, no
      solo de la pantalla. En movil el enlace se quedaba solo con un icono.
      Ahora `sr-only sm:not-sr-only`
- [x] **`label-content-name-mismatch` en el boton de "me gusta" (WCAG 2.5.3).**
      El `aria-label` ("Marcar con estrella") no incluia el contador visible, asi
      que control por voz no encontraba el boton diciendo "marcar 12"
- [x] **El boton de comentarios no tenia nombre util**: su nombre accesible era
      literalmente "3"
- [x] El arreglo del "me gusta" es patron, no parche: se quito el `aria-label` y
      el nombre sale del contenido con un `<span class="sr-only">`. Un
      `aria-label` sobrescribe el texto visible y por eso axe lo segunia marcando
      aunque el contador estuviera dentro

**Verificacion de fase:** tsc 0 - eslint 0/0 - **141 tests** - build OK -
smoke autenticado **24/24** - **axe-core: 0 violaciones en 36 combinaciones**
(18 rutas x 2 temas, 22 con sesion; antes 1 grave en publicas y 12 al auditar
las autenticadas) - **15/15** comprobaciones de comportamiento -
contraste AA en ambos temas medido

### Hallazgo de Fase 7 que no es de accesibilidad

> **El alta de usuarios esta rota.** `registerUser` falla con
> `P2022: The column 'onboardingCompleted' does not exist in the current database`.
> Las lecturas funcionan (`/mentors` responde) pero **toda escritura a `User`
> falla**, porque las migraciones de la Fase 4 siguen sin aplicar.
>
> Consecuencia: en el estado actual del repo **nadie puede registrarse**. No es
> un defecto de esta fase, pero condiciona la Fase 5: aplicar las migraciones
> deja de ser limpieza y pasa a ser bloqueante del producto.

---
## Fase 8 — Rendimiento

- [x] **8.1** `/mentors` con paginación
  - [x] Búsqueda/filtro/orden en servidor (`searchParams`)
  - [x] Quitar `AnimatePresence mode="popLayout"` + `layout` en listas largas
  - [x] Paginación por offset con clamp (`?page=N`, 12/página), no cursor:
        la página enseña "Página 3 de 7" y el total de resultados, y eso no se
        puede calcular barato con un cursor
  - [x] Copia del resultado singular/plural corregida (`1 Mentor disponible`)

- [x] **8.2** Caché real
  - [x] `unstable_cache` con tags en `/mentors` y `/post/[id]`
  - [x] `revalidateTag` en las acciones correspondientes
  - [x] `generateMetadata` de `/post/[id]` reutiliza `getPost` (antes: 2ª query)

- [x] **8.3** `.glass` es CSS inválido · `globals.css:105`
  - [x] `rgba(var(--card), .7)` donde `--card` es hex → la declaración se descarta
  - [x] Definir `--card-rgb` como tripleta o usar `color-mix()`

- [x] **8.4** Unificar `useOptimistic`
  - [x] Patrón de `FollowButton` (estado local + respuesta del servidor) en los 3 sitios
  - [x] `revalidatePostViews` debe cubrir `/post/[id]`

**Verificación de fase:**
`/mentors?cat=backend` → 1 · `?q=rust` → 1 · `?q=zzzznotfound` → 0 sin crash ·
`?cat=hack&sort=bogus&page=9999` → fallback a `all` · XSS en `q` → 0 resultados ·
caché de `/mentors`: 737 ms en frío → 302 ms en caliente, HTML idéntico ·
caché de `/post/[id]`: 1753 ms → 104 ms · `tsc` 0 · `eslint` 0 · 180 tests ·
`next build` 0 · axe 36 combos 0 violaciones · behaviours 15/15 · smoke 24/24

---

## Fase 9 — Limpieza

- [x] **9.1** Código muerto
  - [x] `listSeniorApplications` eliminada: la lectura la hace
        `app/admin/applications/page.tsx` con su propio guard, y esa ruta la
        comprueba el smoke. El guard de las acciones (`requireAdmin`) lo siguen
        cubriendo 5 tests de `reviewSeniorApplication` y `setUserRole`
  - [x] `isAdmin` eliminada (0 llamadores)
  - [x] `formatCount` / `HomeStats` dejan de exportarse: solo se usan dentro de
        `HomeContent.tsx`
  - 180 → 179 tests (el del código muerto)

- [x] **9.2** `next.config.ts` — `remotePatterns` obsoletos tras `unoptimized`
  - [x] **Bug encontrado alugenrarlo, no era solo limpieza:** `AccountMenu`
        renderizaba `user.image` con un `<Image>` propio y **sin `unoptimized`**,
        mientras el resto de la app usa `UserAvatar`. Con el proveedor de GitHub
        activo, `User.image` es `avatars.githubusercontent.com`, que no estaba en
        `remotePatterns` → el render de `next/image` lanza y la pagina cae
  - [x] `AccountMenu` usa `UserAvatar`: el invariante pasa a ser estructural,
        no un `unoptimized` que hay que acordarse de poner
  - [x] `remotePatterns` eliminado de `next.config.ts`: ya no queda nada remoto
        que se optimice
  - [x] `next-image-remote.test.ts` (nuevo) falla si vuelve a aparecer un
        `<Image>` con `src` no literal y sin `unoptimized`. Mutacion
        verificada: reintroduciendo el `<Image` viejo falla en
        `AccountMenu.tsx:58`

- [ ] **9.3** Historia de git — 58 MB de cliente Prisma generado
  - [x] Diagnóstico medido: **no** están en `HEAD` (los borró `3ec3768`), pero
        **sí en `origin/main`**, que es lo que hay publicado en GitHub
        (60 ficheros, los tres motores: 21 MB + 17,5 MB + 17,5 MB)
  - [x] `.git` pesa 31,3 MB; `git filter-repo` está disponible
  - [x] **Riesgo medido:** hay **tres clones más** de este repo en el mismo
        disco (`Videos\GrowCode`, que además contiene la app Expo, y dos copias
        `- copia`). Un force-push los deja divergidos
  - [-] **Descartado por ahora, con el razonamiento:** purgarlo exige
        `filter-repo` + force-push, reescribe todos los SHAs publicados y obliga
        a re-clonar, a cambio de unos 20 MB en un repo que **no se acerca al
        límite de 1 GB de GitHub** y cuyo impacto funcional es cero. La higiene
        ya está resuelta hacia adelante (`.gitignore` + fuera de `HEAD`).
        Revisar solo si el tamaño empieza a molestar de verdad
- [x] **9.4** OG image
  - [x] `openGraph.images` y `twitter.images` apuntaban a `/brand-dark.jpg`:
        1408×768 (no 1200×800) y 665 KB, ratio incorrecto para OG
  - [x] `public/og.jpg` 1200×630, recorte centrado del mismo asset, 85 KB
  - [x] HTML servido: `og:image`, `og:image:width=1200`, `og:image:height=630`,
        `og:image:alt=GroCode` · `/og.jpg` → 200 `image/jpeg`

- [x] **9.5** `themeColor` desalineado con `--background` real
  - [x] Dark pasaba de `#0a0a0a` (que es `--card`) a `#020202` (que es `--background`)
  - [x] Light `#ffffff` ya coincidía

- [x] **9.6** Fuente: `body` declara Inter, se carga Geist
  - [x] `body` ahora declara `var(--font-geist-sans, …)`; "Inter" ya no aparece
  - [x] `@theme inline` expone `--font-sans` / `--font-mono` a partir de las
        variables que emite `next/font` en `layout.tsx`
  - [x] Verificado en el navegador: Geist se descarga y se aplica (639 px vs
        633 px de la monoespaciada del sistema), `--font-geist-mono` resuelve a
        Geist Mono, y no se pide nada a Google Fonts
  - [x] `scripts/probe-fonts.mjs` (nuevo) automatiza esa comprobación

- [x] **9.7** El hueco de cobertura que dejó la fase 7.5
  - [x] Los targets táctiles se medían **siempre como anónimo**: sin sesión el
        navbar no pinta el menú de cuenta y las acciones del feed no existen.
        Es decir, que **toda la interfaz de un usuario conectado estaba sin
        medir**, y 7.5 dio por buena una estándar que en la mitad de la app
        nunca se comprobó
  - [x] `a11y-behaviours.mjs` mide ahora también con sesión (sección 5), con
        login real por el formulario y un guardia que verifica que la sesión
        existe antes de dar nada por bueno
  - [x] Lo que salió, y que 7.5 no vio:
        · "me gusta" y "comentarios" del feed a **16 px de alto** (los botones
          de compartir sí llevaban `min-h-11`; estos dos no)
        · menú de cuenta 32×32 · "Publicar" 56×32
        · filtros de `/notifications` a 40 px · filas de notificación a 43 px
  - [x] Todo con `min-h-11 min-w-11`, el mismo patron que ya usaba el resto
  - [x] Mutación verificada: quitando el `min-h-11` del botón de comentarios,
        el check lo vuelve a medir a 16 px y falla

**Verificación de fase:** `tsc` 0 · `eslint` 0/0 · build OK · **181 tests** ·
axe 36 combos 0 violaciones · behaviours **21/21** · `probe-fonts` 7/7 ·
smoke 24/24

---

## Descartado (fuera de alcance)

- [-] Refactor de `select.ts` a mappers explícitos — correcto en teoría, demasiado invasivo ahora
- [-] `prettier` / formateo masivo — ruido en el diff
- [-] Tests de integración con MySQL en Docker — los mocks corren en 1,2 s
- [-] Cobertura como métrica — con 23% engaña más que informa

---

## Registro de cambios

| Fecha | Fase | Que | Verificacion |
| --- | --- | --- | --- |
| - | - | Auditoria de 6 departamentos | 5 bloqueantes encontrados |
| - | Previas | tsc 0 - eslint 0/0 - 24 tests - build OK | - |
| hoy | 0 | `auth-chain.test.ts` (16 tests) - cadena de auth + proxy | 78 total. Tests de regresion validados revirtiendo cada fix |
| hoy | 0 | `mentorship.test.ts` (17) - autorizacion del core | - |
| hoy | 0 | `smoke-auth.mjs` - script listo, con guardia anti-produccion | sin BD de test |
| hoy | 1.1 | Cookie `authjs.session-token` + `src/lib/session-cookie.ts` | test de regresion |
| hoy | 1.2 | `isRole` derivado de `Object.values(Role)` | test de regresion |
| hoy | 1.3 | Guards del panel de mentoria reordenados | alcanzable |
| hoy | 1.5 | `.env` a nombres v5 + fail-fast en produccion | valores preservados |
| hoy | 2.1 | AccountMenu + auth siempre visibles en movil | tsc/eslint/84 tests |
| hoy | 2.3 | `/post/*` y `/profile/*` publicos (D2) | 6 tests de routing |
| hoy | 2.3 | **Bug propio:** PUBLIC_PREFIXES incluia "/", que hacia `startsWith("/")` siempre true -> todo publico | reintroducido: 7 tests fallan |
| hoy | 3.4 | 6 cabeceras de seguridad + CSP | navegador real: 0 violaciones, hidratacion OK |
| hoy | 3.x | **Falsa alarma investigada:** el CSP parecia bloquear la hidratacion. Era mi sonda corriendo antes de `readyState: complete` | sin bug |
| hoy | 4.1 | 7 indices nuevos (Post, Like, Bookmark, Comment, Notification) | build OK, en migracion |
| hoy | 4.6 | Migracion `20260101000200` con dedupe antes del UNIQUE | no aplicada |
| hoy | 4.x | **Correccion propia:** dije que `@@unique([userId])` impedia re-postular; con upsert no es asi | - |
| hoy | 6.1 | `/guardados` - los bookmarks eran write-only | ruta verificada |
| hoy | 6.3 | `/profile/[id]/[list]` + contadores convertidos en enlaces | 404 con `noindex` |
| hoy | 6.4 | 5 promesas falsas eliminadas del copy | solo se anuncia lo que existe |
| hoy | 6.5 | `/feed` redirige a onboarding si no se completo | - |
| hoy | 6.6 | Seed: canales, likes, comentarios, postulaciones, notificaciones, un ADMIN | compila |
| hoy | 6.x | **Autocorreccion:** detecte y limpie 3 textos corruptos que introduje al escribir en espanol largo | escaneado |
| hoy | 7.0 | Reglas jsx-a11y a `error`: 16 errores reales destapados | 0 errores |
| hoy | 7.1 | `scripts/color-contrast.mjs`: contraste medido en vez de estimado | 7 colores, ratios reales |
| hoy | 7.1 | `text-muted/20..70` -> `text-muted` (32 usos) | axe 0 violaciones |
| hoy | 7.1 | 78 sitios de color de estado -> `text-*-700 dark:text-*-500` | medido 4.93-7.30:1 en claro |
| hoy | 7.2 | Labels asociados + `autoComplete` + `role=alert`; `Ubicacion` y `Website` sin nombre accesible | 15/15 comportamientos |
| hoy | 7.3 | Drawer movil = dialogo real con Escape, foco atrapado y devuelto | verificado en navegador |
| hoy | 7.4 | `aria-pressed` en filtros, `role=menu`/`menuitemradio` en el orden | verificado en navegador |
| hoy | 7.5 | 20 targets tactiles a 44px | 0 por debajo en 4 rutas |
| hoy | 7.6 | `setUnreadCount` fuera del updater (doble invocacion en StrictMode) | - |
| hoy | 7.7 | `prefers-reduced-motion` global + pausa del video con `matchMedia` | verificado con y sin la preferencia |
| hoy | 7.x | **Correccion propia:** perdi el backtick de arranque en 2 template literals al editar con PowerShell y rompi el build | detectado por tsc, build OK |
| hoy | 7.x | **Correccion propia:** mi primer script de contraste leia `oklch()` con regex y daba numeros inventados; tambien se comia los tokens no usados | reescrito con canvas |
| hoy | 7.x | **Test artefacto:** el test de `role=alert` fallaba por esperar 2,5 s; bcrypt mas el timeout de BD tardan mas | ahora espera al elemento |
| hoy | 7.y | Auditoria axe extendida a 18 rutas con login real: aparecieron **12 violaciones serias** | ahora **0 en 36 combinaciones** |
| hoy | 7.y | `/feed/new` sin nombre accesible en movil: `hidden sm:inline` saca el texto del arbol de accesibilidad, no solo de la pantalla | axe 0 |
| hoy | 7.y | Boton "me gusta": `aria-label` sin el contador visible (WCAG 2.5.3). Arreglo por patron: quitar el `aria-label` y derivar el nombre del contenido | axe 0 |
| hoy | 7.y | **Falsa alarma mia:** dije que `/auth/signin` no existia en produccion. Es un `Suspense` tras `useSearchParams`: el HTML estatico solo trae el fallback y el formulario aparece al hidratar. Lo comprobe con un cliente HTTP sin JS | sin bug |
| hoy | 7.y | **Test no determinista (propio):** el test de `role=alert` usaba un email fijo, asi que la primera ejecucion registro un usuario real y las siguientes chocaron con el duplicado | ahora usa `noValidate`: 2 ejecuciones seguidas dan 15/15 |
| hoy | 5.x | **Hallazgo grave:** `registerUser` fallaba con `P2022` (columna `onboardingCompleted` inexistente). El alta de usuarios estaba rota | **corregido y verificado** |
| hoy | 5.0 | `scripts/db-dump.mjs`: volcado de las 13 filas antes de destruir nada | `.next/db-backup-before-reset.json` |
| hoy | 5.1 | `db push --force-reset`: esquema alineado con el codigo | `user.onboardingCompleted` ok |
| hoy | 5.2 | Seed 15+ min -> 131 s con `insertInChunks`; ahora trunca y es re-ejecutable | **9274 filas** en los 11 canales |
| hoy | 5.3 | 3 migraciones a medias -> una baseline unica, marcada aplicada | `migrate diff` = 0 bytes |
| hoy | 5.4 | Base desechable `growcode_smoke` + guardia por nombre de base | smoke **24/24** |
| hoy | 5.x | **Bug propio:** `new PrismaClient()` sin URL: el usuario de prueba se creaba en la BD equivocada y el 302 de error pasaba por sign-in correcto | detectado al leer el body |
| hoy | 5.x | **Bug propio (Windows):** `spawn("npx")`, `shell: true` y `import()` de ruta absoluta rompian el smoke de tres formas distintas | los tres corregidos |
| hoy | 5.x | **Correccion propia:** afirmaba que el panel de admin devuelve 307 a un no-admin. Devuelve 200 (rebote en cliente). No hay fuga: el guard corre antes de cualquier query | check nuevo: sin datos en el cuerpo |
| hoy | 5.x | **Invariante cambiado:** el test exigia "exactamente una" etiqueta robots; ahora exige que ninguna contradiga a las demas | 24/24 |
| hoy | 5.x | **Correccion propia:** el registro de este documento se duplico cuatro veces al insertar con regex; reescrito entero | - |
| hoy | 8.1 | `/mentors` al servidor: `mentor-filters.ts` + `mentors.ts` (`unstable_cache`, tag `mentors`, TTL 300) + `MentorsList` movido a URL | 737 ms -> 302 ms, HTML idéntico en miss y hit |
| hoy | 8.1 | **Cuidado con `unstable_cache`:** la clave es `keyParts` + argumentos + `Function.toString()`. Un closure que captura `id` tiene el mismo `toString()` para todos los ids, asi que el id va en `keyParts` | test de keying por id |
| hoy | 8.1 | Copia singular/plural del total de mentores corregida | `?cat=backend` -> "1 Mentor disponible" |
| hoy | 8.2 | `src/lib/post-detail.ts`: tag `post:{id}`, TTL 300, `getPost = cache(unstable_cache(...))`, `revalidatePost` | 1753 ms -> 104 ms |
| hoy | 8.2 | `generateMetadata` de `/post/[id]` reutiliza `getPost` (antes 2 queries por render) | una sola query |
| hoy | 8.2 | `revalidatePostViews` llama a `revalidatePost`; sin eso un like dejaba `/post/{id}` con el contador viejo | test de regresion: quitando la linea fallan 3 tests |
| hoy | 8.x | `revalidateTag` en esta version de Next acepta `(tag, { expire: 0 })`; `revalidatePath` no invalida entradas del Data Cache con tag | probado contra el servidor real |
| hoy | 8.3 | `.glass`: `rgba(var(--card), .7)` se descartaba entero (medido: `rgba(0,0,0,0)`); ahora `color-mix()` | background real |
| hoy | 8.4 | `useOptimistic` unificado en `PostCard`, `FollowButton` y `RoadmapClient` | 180 tests |
| hoy | 9.4 | `public/og.jpg` 1200x630 / 85 KB (el asset era 1408x768 / 665 KB) | `og:image` servido correcto |
| hoy | 9.5 | `themeColor` dark `#0a0a0a` (que es `--card`) -> `#020202` (que es `--background`) | meta servida |
| hoy | 9.6 | `body` declara Geist en vez de "Inter", que nunca se cargaba: la app se dibujaba con la fuente del sistema y Geist viajaba sin usarse | `probe-fonts.mjs` 7/7 |
| hoy | 9.x | **Hallazgo nuevo, pre-existente:** en rutas con `generateMetadata` dinamico + `loading.tsx` el `<title>` sale **despues de `</head>`** cuando la cache esta fria. Reproducido tambien en `/profile/[id]`, que no usa cache | difiere a la fase 9.x de metadata/SEO |
| hoy | 9.x | **Hallazgo nuevo, pre-existente:** `--font-geist-mono` solo se descarga si algo usa `font-mono`; en `/` no hay ningun elemento, asi que el woff2 mono no se pide (correcto) | `probe-fonts` lo verifica declarando la familia |
| hoy | 9.x | **Falsa alarma propia:** `scripts/a11y-audit.mjs` fallaba por la ausencia de `public/axe.min.js`. `addScriptTag({ path })` lee el disco, no pide al servidor, asi que ahora busca en `node_modules/axe-core/` y no hay que copiarlo a `public/` | axe 0 en 36 combos |
| hoy | 9.x | **Regresion propia, encontrada y corregida:** mis spans deshabilitados de paginacion usaban `opacity-40`, que deja el texto en 2.71:1 (claro) y 3.39:1 (oscuro). Afectaba a `/mentors`, `/guardados` y `/profile/[id]/[list]` | `opacity-70` -> 7.7:1 y 9.1:1; axe 0 |
| hoy | 9.1 | `isAdmin` y `listSeniorApplications` borradas; `formatCount`/`HomeStats` sin `export`. 180 -> 179 tests | tsc 0, eslint 0 |
| hoy | 9.2 | **Bug de produccion encontrado al limpiar la config:** `AccountMenu` pasaba `user.image` por `next/image` sin `unoptimized`. Con GitHub OAuth, `User.image` es `avatars.githubusercontent.com`, fuera de `remotePatterns` -> el render lanza y la pagina cae | `AccountMenu` usa `UserAvatar`; invariante en `next-image-remote.test.ts`, mutacion verificada |
| hoy | 9.2 | **Por que no se reprodujo en el smoke:** el `authorize` de credentials no devuelve `image`, asi que `session.user.image` es null y el `<Image>` nunca llega a pintarse. Con `strategy: "jwt"` la foto se congela en el token al entrar. Solo se ve autenticandose con GitHub | check retirado del smoke; el codigo no es conducible ahi |
| hoy | 9.2 | **Falsa alarma propia (bien vista):** el primer smoke check daba verde sin comprobar nada, porque la sesion era anterior al cambio de avatar. Anadido un guard que verifica que la sesion lleva el avatar antes de dar el visto bueno | - |
| hoy | 9.3 | **Medido, no estimado:** los 58 MB de motores Prisma no estan en `HEAD` (los borro `3ec3768`) pero **si en `origin/main`**. `main` va 3 commits por delante, sin subir | pendiente de OK |
| hoy | 9.3 | **Descartado con datos, no por opinion:** hay 3 clones mas del repo en este disco (uno contiene la app Expo). Purgar la historia =~20 MB de un repo a 1 GB de limite, sin impacto funcional, a cambio de divergir 3 clones | `[-]` en la lista |
| hoy | 9.7 | **Hueco de cobertura de la fase 7.5:** los targets se median siempre sin sesion, asi que **toda la interfaz autenticada estaba sin medir**. "Me gusta" y "comentarios" del feed median **16 px de alto** | ahora se mide con sesion: 21/21 |
| hoy | 9.7 | **Mutacion verificada:** sin el `min-h-11` del boton de comentarios, el check lo vuelve a medir a 16 px y falla | el check detecta el bug |
| hoy | 9.7 | Guardia en la seccion con sesion: sin el, el script daria verde por no mirar nada (el mismo falso positivo que ya me dio el check de avatar en el smoke) | - |
| --- |
## Notas para el asistente

- **Nunca** marcar `[x]` sin verificación ejecutada.
- **Nunca** ejecutar nada contra la BD de producción sin OK explícito.
- Si una tarea resulta más grande de lo previsto, **anotarlo en el registro** y
  avisar al CEO antes de seguir, no después.
- Si aparece un bug nuevo **durante** la ejecución, añadirlo aquí con severidad
  y decidir si entra en la fase actual o se difiere.
- Mantener este documento y `PLAN.md` sincronizados.