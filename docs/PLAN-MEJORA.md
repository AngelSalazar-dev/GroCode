# Plan de mejora — GroCode

> **Estado:** propuesto, pendiente de arrancar.
> **Base:** `INFORME-TECNICO-GroCode.md` revalidado contra este repo + auditoría propia del 6-nov-2026.
> **Documentos relacionados:** [`PLAN.md`](./PLAN.md) (remediación inicial), [`CHECKLIST.md`](./CHECKLIST.md) (evidencia de lo ya hecho).

## Punto de partida (verificado)

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores / 0 warnings |
| `npm test` | ✅ 181 tests, 15 archivos |
| `npm run build` | ✅ OK |
| INFORME Muse — C1, C2, C3, C4, C6, I1, I6, I10, I13, M1–M12 | ✅ ya resueltos en este repo |
| INFORME Muse — C5 (seed) + I11 (`.env.example`) | ✅ cerrados en la sesión del 6-nov-2026 |
| `npm audit --omit=dev` | ❌ 4 vulnerabilidades: **1 crítica (Next), 2 altas, 1 moderada** |

Lo que queda no son los hallazgos del informe: son los huecos que el informe dejó
abiertos o que este repo (más nuevo) todavía no cubre.

## Reglas de ejecución

1. **Una iteración = un commit.** No se mezclan dependencias con features.
2. **Nada se marca hecho sin evidencia**: salida de `typecheck`, `lint`, `test`,
   `build` o el script de verificación de esa iteración.
3. **Ningún cambio de schema contra una base compartida.** Solo BD desechable
   (`*_ci`, `*_smoke`) o local.
4. **Producción no se toca** sin aprobación explícita.
5. Si una iteración necesita una decisión (credenciales, proveedor, política de
   producto), se detiene y se pregunta antes de escribir código.

## Estado de ejecución

- **I1 — hecho (6-nov-2026).** `npm audit fix` subió `next` a 16.4.5 y `zod` a
  4.6.7 (lockfile; `package.json` conserva los rangos). `npm audit --omit=dev
  --audit-level=high` → **0 vulnerabilidades**. `typecheck`, `lint`, `181 tests`
  y `build` en verde. Quedan 11 vulnerabilidades **solo de desarrollo**
  (`prisma` CLI → `deepmerge-ts`, `eslint-config-next` → `minimatch`); cerrarlas
  exige saltos mayores (Prisma 7 / downgrade de eslint-config-next) y se dejan
  fuera de esta iteración.

- **I2 — implementado, pendiente de la primera ejecución en CI (6-nov-2026).**
  El workflow levanta `postgres:16`, aplica `prisma migrate deploy`, corre
  `migrate diff --exit-code` y ejecuta `scripts/smoke-auth.mjs`. Validado en
  local: YAML parsea (`js-yaml`) y `prisma validate` pasa. **No se pudo ejecutar
  de punta a punta aquí** porque no hay Docker/Postgres local; la prueba real es
  el próximo push o PR.

- **I3 — hecho (6-nov-2026).** `createPost` 10/h, `addComment` 20/h,
  `toggleLike` 60/h y `toggleFollow` 60/h, con buckets por `session.user.id`
  (nunca por IP). Tests de umbral en `src/tests/content-limits.test.ts`
  (incluye que el límite no es global). `typecheck`, `lint` y **186 tests**
  en verde.

- **I7 — hecho (6-nov-2026).** Nuevo `src/lib/logger.ts`: una línea JSON por
  evento (`level`, `event`, `time`) que **nunca** serializa el objeto de error
  (Prisma adjunta `meta` con la query) y redacta emails como `[email]`.
  Sustituidos los `console.error` de acciones, `notifications`, `auth.config` y
  la home. `/api/health` ya no devuelve `error.message`: el detalle va al log y
  el cuerpo queda genérico. Tests: `logger.test.ts` (error Prisma sin `meta` ni
  email) y `health.test.ts` (503 sin fuga). **191 tests** en verde.

- **I4 — diferida a propósito (6-nov-2026).** No hay tráfico ni abuso que
  justifique crear una cuenta de Upstash. El límite actual en memoria sigue
  encareciendo el spam; solo es N× con instancias concurrentes. **Condición de
  disparo:** más de ~500 usuarios activos o evidencia real de spam. El
  intercambio sigue siendo un solo punto: `limit()`.

## Resumen

| # | Iteración | Cierra | Esfuerzo | Depende de |
|---|---|---|---|---|
| I1 | Parchear dependencias críticas | CVE crítica de Next + altas | 1–2 h | — |
| I2 | CI con Postgres real + smoke autenticado | Migraciones y auth sin probar en CI | 2–3 h | — |
| I3 | Límites anti-abuso en contenido | Spam en posts/comentarios/likes/follows | 1–2 h | — |
| I4 | Rate limiting distribuido | Límite efectivo N× en Vercel | 2–4 h | **D4: Upstash** |
| I5 | Recuperación de contraseña | Usuario bloqueado sin vía de recuperación | 4–6 h | **D5: proveedor de email** |
| I6 | Verificación de email | Suplantación/bloqueo de emails ajenos | 4–6 h | **D5** + decisión de política |
| I7 | Observabilidad y health | Errores sin traza útil y fuga en `/api/health` | 2 h | — |
| I8 | Conversación de mentoría | La mentoría termina en "aceptada", sin canal | 1–2 sem | **D6: producto** |

---

## I1 — Parchear dependencias críticas

**Por qué ahora.** `npm audit --omit=dev` reporta:

- `next` 16.0.0–16.4.0: **RCE no autenticado** en Image Optimization y `use cache`.
- `zod` < 4.6.6 y `source-map-js` ≤ 1.2.1: DoS de severidad alta.

Es la única vulnerabilidad crítica accionable sin decisiones externas.

**Alcance**

- `npm audit fix` (sin `--force`). Si propone un salto mayor, fijar el parche
  mínimo dentro de la misma major.
- Regenerar Prisma si cambia el lockfile.
- Revisar `node_modules/next/dist/docs/` si algún API usado cambia.

**Aceptación**

```bash
npm audit --omit=dev --audit-level=high   # exit 0
npm run typecheck && npm run lint && npm test && npm run build
```

**Fuera de alcance:** actualizar Expo (no existe en este repo), refactors por
motivos de estilo.

---

## I2 — CI con Postgres real + smoke autenticado

**Por qué.** El CI actual compila con una `DATABASE_URL` falsa: nunca aplica las
migraciones ni ejecuta una petición con sesión. Un error de migración o un
lockout de auth pasaría verde. El script `smoke-auth.mjs` ya existe y hace las
24 comprobaciones; solo le falta una base.

**Alcance**

- Añadir `services: postgres:16` al job `verify` con healthcheck.
- Paso `npx prisma migrate deploy` contra `growcode_ci`.
- Paso `node scripts/smoke-auth.mjs` con:
  - `SMOKE_DATABASE_URL=postgresql://.../growcode_ci`
  - `AUTH_SECRET` de CI.
- Quitar el comentario de "pendiente de BD" del workflow.

**Aceptación**

- CI verde con el smoke en **24/24**.
- Prueba negativa: una migración rota a propósito debe hacer fallar el job
  (se comprueba una vez y se revierte).
- En local: `SMOKE_DATABASE_URL=... npm run smoke` sigue funcionando.

**Riesgo.** `smoke-auth.mjs` usa `next dev` (lento pero fiel). Si el job supera
los 15 min, subir timeout antes de recortar comprobaciones.

---

## I3 — Límites anti-abuso en contenido

**Por qué.** `limit()` se usa en login, registro, postulación senior y
notificaciones, pero **no** en las acciones que escribe contenido. Un script
puede crear posts, comentarios, likes y follows sin freno.

**Alcance**

- `createPost`: 10/hora por usuario.
- `addComment`: 20/hora por usuario.
- `toggleLike` / `toggleFollow`: 60/hora por usuario (evita inflar contadores).
- Buckets por `session.user.id`, nunca por IP (una IP compartida castigaría a
  un aula o una oficina).
- Tests de umbral para cada acción.

**Aceptación**

```bash
npm test          # incluye los nuevos umbrales
npm run typecheck && npm run lint
```

**Fuera de alcance:** rate limiting distribuido (I4).

---

## I4 — Rate limiting distribuido

**Por qué.** El `Map` en memoria vive por instancia: con N lambdas el límite
efectivo es N × el nominal. Con credenciales de Upstash, la interfaz `limit()`
ya está lista para el swap.

**Alcance**

- Adaptador Upstash REST detrás de `limit()`; fallback al `Map` si faltan
  variables (dev y tests).
- Variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- Tests con `fetch` inyectado: ventana, `retryAfter`, fallback.
- Documentar en `.env.example` y README.

**Aceptación**

- Tests del adaptador en verde.
- Con las dos variables puestas, dos invocaciones en procesos distintos
  comparten contador (script de comprobación).

**Decisión D4:** Upstash ($0 en free tier) vs Vercel Pro. Recomendado Upstash.
Sin credenciales no se puede cerrar; el código puede quedar listo y desactivado.

---

## I5 — Recuperación de contraseña

**Por qué.** La página se eliminó porque era simulada. Hoy un usuario que olvida
su contraseña no tiene ninguna vía: la cuenta queda perdida.

**Alcance**

- Reutilizar `VerificationToken` con `identifier = "reset:<email>"`.
- `requestPasswordReset`: respuesta **siempre genérica** (no revelar si el email
  existe), rate limit por IP y por email.
- `resetPassword`: token de un solo uso, caducidad 1 h, borra tokens previos,
  hash bcrypt coste 12.
- Páginas `/auth/forgot-password` y `/auth/reset-password?token=`.
- Transporte de email detrás de una interfaz; en desarrollo escribe el enlace en
  consola, en producción usa el proveedor que se decida.

**Aceptación (tests)**

- Token caducado → rechazado.
- Token reutilizado → rechazado.
- Email desconocido → misma respuesta y mismo tiempo aproximado.
- Contraseña < 8 caracteres → rechazada.
- Flujo manual completo en local.

**Decisión D5:** proveedor de email (Resend, Supabase SMTP, otro). Sin él, la
iteración se entrega con transporte de desarrollo y `TODO` explícito.

**Riesgo.** Las sesiones JWT ya emitidas no se revocan al cambiar la contraseña.
Se documenta; revocación real exige `session.version` (fuera de alcance).

---

## I6 — Verificación de email

**Por qué.** `VerificationToken` existe sin uso y hoy cualquiera puede registrar
el email de otra persona. Ese email queda bloqueado para su dueño.

**Alcance**

- Enviar token al registrarse (mismo transporte que I5).
- `/auth/verify?token=`: marca `emailVerified`.
- **Política recomendada (suave):** dejar entrar, mostrar banner persistente
  hasta verificar, y limitar acciones sensibles (postular a Senior) a cuentas
  verificadas. No bloquear el login en el día 1.
- Reenvío con rate limit.

**Aceptación**

- Registro → token → verificación → banner desaparece.
- Token caducado/reutilizado rechazado.
- Cuenta sin verificar no puede postular a Senior.

**Decisión:** bloquear login hasta verificar (duro) vs banner + límites (suave).
Recomendado suave.

---

## I7 — Observabilidad y health

**Por qué.** Hay ~20 `console.error` sin estructura y `/api/health` devuelve el
mensaje crudo del error de base de datos. Sirve para diagnosticar, pero también
para filtrar detalles internos.

**Alcance**

- `src/lib/logger.ts`: JSON con `level`, `event`, `requestId` opcional; **nunca**
  objetos de Prisma ni emails.
- Sustituir los `console.error` de acciones/API por `logger.error`.
- `/api/health`: log interno del error, respuesta externa genérica
  (`{ status: "degraded", db: "down" }`).

**Aceptación**

- `npm test` + `npm run lint` verdes.
- `/api/health` con BD caída responde 503 sin `error.message`.
- Un test comprueba que el logger no serializa el objeto de error de Prisma.

**Fuera de alcance:** Sentry/OpenTelemetry (decisión y coste aparte).

---

## I8 — Conversación de mentoría (producto)

**Por qué.** El flujo actual termina en `ACCEPTED`. No hay canal ni mensajes: el
junior y el senior no tienen dónde hablar. El informe lo señalaba como hueco de
producto, no como bug.

**Opciones**

| Opción | Esfuerzo | Infra |
|---|---|---|
| Hilo de mensajes con polling (5–10 s) | 1 sem | Ninguna nueva |
| Realtime (Supabase Realtime / Socket.io) | 2 sem | Servicio adicional |

**Recomendación:** polling primero; demuestra si la conversación se usa antes de
pagar infraestructura.

**No se ejecuta sin decisión D6.**

---

## Decisiones necesarias

| # | Decisión | Bloquea | Recomendación |
|---|---|---|---|
| D4 | Upstash vs Vercel Pro | I4 | Upstash |
| D5 | Proveedor de email | I5, I6 | Resend o SMTP de Supabase |
| D6 | Chat de mentoría y su infraestructura | I8 | Polling |
| D7 | Política de verificación de email | I6 | Suave (banner + límites) |

## Arranque recomendado

**I1 + I2** (≈ 4 h): cierran la única CVE crítica y convierten el CI en una
prueba real de migraciones y autenticación. El resto se decide después.
