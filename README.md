# GroCode

Plataforma social de mentoría para desarrolladores: feed de recursos por
canales, directorio de mentores, solicitudes de mentoría, notificaciones y
roadmap de aprendizaje.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · NextAuth v5 ·
Prisma 6 + MySQL/TiDB · Tailwind CSS v4 · Framer Motion · Vitest

## Documentos de trabajo

- [`docs/PLAN-MEJORA.md`](./docs/PLAN-MEJORA.md) — plan de mejora por iteraciones (el vigente)
- [`docs/PLAN.md`](./docs/PLAN.md) — plan de remediación tras la auditoría por departamentos
- [`docs/CHECKLIST.md`](./docs/CHECKLIST.md) — checklist viva del plan (se actualiza al avanzar)

---

## Puesta en marcha

```bash
npm install                 # instala y genera el cliente Prisma (postinstall)
cp .env.example .env.local  # y rellena los valores
npm run db:deploy           # aplica las migraciones
npm run db:seed             # datos de ejemplo (opcional)
npm run dev
```

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL. Ej: `postgresql://user:pass@host:5432/postgres?sslmode=require` |
| `AUTH_SECRET` | Secreto de firma de sesión (v5; `NEXTAUTH_SECRET` se ignora). Generar con `npx auth secret` |
| `AUTH_URL` / `AUTH_TRUST_HOST` | URL base de la app y confianza en el host del proxy |
| `GITHUB_ID` / `GITHUB_SECRET` | Credenciales OAuth de GitHub |
| `SEED_PASSWORD` | Opcional, solo desarrollo. Si se define, todas las cuentas del seed comparten esa contraseña; si no, cada una recibe una aleatoria |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (una pasada) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run db:migrate` | Crea una migración desde el schema (requiere DB de desarrollo) |
| `npm run db:deploy` | Aplica migraciones pendientes |
| `npm run db:push` | Sincroniza el schema sin crear migración ( prototyping ) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Carga datos de ejemplo |

> ⚠️ `db:migrate` y `db:push` pueden modificar datos de forma destructiva.
> `DATABASE_URL` puede apuntar a producción: no corras estos comandos contra ella.

## Estructura

```
prisma/
  schema.prisma          Modelo de datos (PostgreSQL)
  migrations/            Migraciones versionadas
  seed.ts                Datos de ejemplo
src/
  actions/               Server Actions (una función async exportada = endpoint HTTP)
  app/                   Rutas (App Router)
  auth/                  Configuración de NextAuth v5
  components/            Componentes React
  lib/
    prisma.ts            Singleton de PrismaClient
    select.ts            Whitelists de campos seguros para el cliente
    channels.ts          Catálogo único de canales del feed
    notifications.ts    Factoría de notificaciones (server-only)
    rate-limit.ts        Rate limiting en memoria
  proxy.ts               Middleware de autenticación
```

## Reglas de seguridad del proyecto

Estas son las invariantes que sostienen la app. Romperlas introduce
vulnerabilidades, no solo warts.

1. **Nunca serializar `User` completo hacia el cliente.**
   `password` es un hash bcrypt y `email` es PII. Usa siempre
   `publicUserSelect` o `postAuthorSelect` de `src/lib/select.ts` en cualquier
   query cuyos datos lleguen a un Client Component. La única excepción es
   `/admin/applications`, donde el staff necesita el email del candidato.

2. **Nada sensible en un módulo `"use server"`.**
   Todo lo que exporte uno de esos archivos se convierte en un endpoint HTTP
   público. Solo exporta funciones async (una clase exportada hace que el módulo
   reporte cero exports en build). Para helpers usa `src/lib/*.ts`
   (ej. `notify()` en `lib/notifications.ts`).

3. **Los roles no son autoasignables.**
   Solo un Junior se elige a sí mismo en onboarding. `SENIOR` requiere una
   `SeniorApplication` revisada en `/admin`; `ADMIN` se concede por SQL. Las
   acciones privilegiadas viven en `src/actions/admin.ts` y exigen `Role.ADMIN`.

4. **`redirect()` fuera del `try`.**
   Lanza `NEXT_REDIRECT`; un `catch` lo convierte en un error genérico y
   rompe la navegación.

## Roles

| Rol | Cómo se consigue | Puede |
| --- | --- | --- |
| `JUNIOR` | Automático al registrarse; también se elige en onboarding | Publicar, comentar, solicitar mentoría |
| `SENIOR` | Solo tras aprobar una `SeniorApplication` en `/admin` | Aparece en `/mentors`, recibe y responde solicitudes |
| `ADMIN` | **Manual**: `UPDATE User SET role='ADMIN' WHERE email='tu@correo.com'` | Revisar postulaciones en `/admin/applications`, gestionar roles |

Nadie puede auto-asignarse `SENIOR` ni `ADMIN`. El onboarding solo escribe `JUNIOR`.

### Dar de alta al primer administrador

El enum `ADMIN` existe desde la migración `20260101000100`, pero la migración no
promueve a nadie (para no conceder acceso implícitamente). Después de aplicar las
migraciones:

```sql
UPDATE `User` SET `role` = 'ADMIN' WHERE `email` = 'tu@correo.com';
```

Ese usuario verá el enlace **Panel** en la navbar.

### Revisar postulaciones

`/admin/applications` usa un flujo de dos pasos a propósito: primero **Marcar
verificada** (revisas el GitHub enlazado) y después **Aprobar insignia**. La
aprobación directa está bloqueada por código para que el paso de verificación no
se pueda saltar. Al aprobar, el rol pasa a `SENIOR` y la persona recibe una
notificación.

---

## Scripts de base de datos

El cliente Prisma generado (`src/generated-v2/`) **no** se versiona en git.
Se regenera con `npm install` o `npx prisma generate`.

`prisma` (la CLI) está en `devDependencies` a propósito: solo se usa en build y
en `db:*`. En producción solo se instala `@prisma/client`.
