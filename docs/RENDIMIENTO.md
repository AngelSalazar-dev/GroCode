# Rendimiento — estado de las 31 mejoras

> Auditoría del 9-nov-2026 sobre el repo local (la app de la raíz).
> Leyenda: **Hecho** = ya está en el código · **No aplica** = la app no tiene ese caso · **Pendiente** = requiere código o una decisión.

## Resumen

| # | Mejora | Estado | Evidencia / motivo |
|---|---|---|---|
| 1 | Skeletons de carga | **Hecho** | 9 `loading.tsx` (feed, mentors, perfil, post, roadmap, admin, onboarding…) |
| 2 | Imágenes WebP/AVIF | **Hecho (parcial)** | `next/image` sirve WebP. AVIF no aporta: solo se optimizan 2 isotypes de 32 px; los avatares remotos van `unoptimized` a propósito |
| 3 | Evitar llamadas duplicadas a la API | **Hecho** | No hay fetch en cliente; todo son Server Components |
| 4 | Debounce en búsqueda | **No aplica** | El buscador de mentores filtra en memoria sobre la lista cacheada ya paginada |
| 5 | Paginar resultados | **Hecho** | `/feed`, `/mentors` y las listas de seguidores/seguidos paginan (24–30 por página) |
| 6 | Estáticos desde CDN | **Hecho** | Vercel sirve `/_next/static` desde su CDN con cache inmutable |
| 7 | Cola de trabajos | **No aplica** | No hay tareas lentas: el seed es el único proceso largo y es offline |
| 8 | Consultas N+1 | **Hecho** | `include`/`select` con relaciones en una consulta; 45 `select` explícitos y sin bucles con queries |
| 9 | Compresión Brotli/Gzip | **Hecho** | Vercel comprime automáticamente; no se configura en el repo |
| 10 | Caché Redis | **No aplica (hoy)** | `unstable_cache` cubre mentores y detalle de post, que es lo único leído de forma intensiva. Redis sería una decisión de infraestructura |
| 11 | Quitar dependencias sin usar | **Hecho (sin hallazgos)** | Revisadas las 13 dependencias: todas se importan. `framer-motion` se usa en 5 componentes (home, mentores, notificaciones, perfil, roadmap) |
| 12 | Timeout a APIs externas | **Hecho (parcial)** | `/api/health` usa `TIMEOUT_MS = 5 s`; la única API externa es GitHub OAuth, gestionada por Auth.js |
| 13 | Streaming de IA token a token | **No aplica** | La app no tiene IA |
| 14 | Optimistic UI | **Hecho** | `useOptimistic` en likes y guardados (`PostCard.tsx`) |
| 15 | Lazy loading de imágenes | **Hecho** | Valor por defecto de `next/image`; el logo del navbar va sin lazy por ser above-the-fold |
| 16 | Peticiones independientes en paralelo | **Hecho** | `Promise.all` en home, perfil y listas; el resto son queries con relaciones |
| 17 | Índices para consultas comunes | **Hecho** | `@@index([channel, createdAt])`, `[authorId, createdAt]`, `[postId, createdAt]`, `[userId, read]`, etc. |
| 18 | OpenTelemetry | **Pendiente (decisión)** | No hay tracing. Añadirlo implica proveedor (Sentry, Vercel, OTel) y coste |
| 19 | Servidor cerca de la base de datos | **Pendiente (infra)** | La BD está en Supabase; la región de las funciones de Vercel debe coincidir con la del proyecto |
| 20 | Render en servidor o build | **Hecho** | Todo es RSC; solo home/feed/listas son dinámicos porque muestran datos vivos |
| 21 | Scripts de terceros después de la página | **No aplica** | No hay scripts de terceros; los vídeos son iframes de YouTube en `frame-src` |
| 22 | Dividir JavaScript por página | **Hecho** | División automática de Next por ruta; no hay barril de componentes pesados |
| 23 | Virtualizar listas largas | **No aplica** | Ninguna lista renderiza más de una página de 24–30 filas |
| 24 | Pedir solo las columnas necesarias | **Hecho** | `select: publicUserSelect…` en todos los listados; no hay `SELECT *` |
| 25 | Pool de conexiones | **Pendiente** | Prisma usa 5432 (conexión directa). En serverless conviene el pooler de Supabase (6543) con `?pgbouncer=true&connection_limit=1` |
| 26 | Evitar re-renders innecesarios | **Hecho** | Componentes de servidor por defecto; `FeedClient` usa `useCallback` y el estado optimista está acotado al post |
| 27 | Caché de estáticos en el navegador | **Hecho (parcial)** | `/_next/static` es `immutable`; `public/` no lleva `Cache-Control` propio (pendiente menor) |
| 28 | Repartir tráfico entre instancias | **Hecho** | Vercel escala por instancia. Ojo: el rate limit es en memoria (ver I4 del plan) |
| 29 | Fuentes alojadas y con grosores limitados | **Hecho** | `next/font/google` (Geist y Geist Mono) las autohospeda y son variables: un solo archivo por familia |
| 30 | Monitoreo de velocidad de usuarios reales | **Pendiente (decisión)** | Sin RUM. Candidato: Vercel Speed Insights |
| 31 | Probar en celulares y redes lentas | **Pendiente** | No hay presupuesto de rendimiento en CI. Candidato: Lighthouse CI con perfil móvil |

## Qué queda, en orden de valor

1. **Pooler de conexiones (25 + 19)** — un cambio de `DATABASE_URL` en producción y en `.env.example`; evita agotar conexiones en serverless.
2. **Lighthouse CI móvil (31)** — un job que falle si LCP/CLS o el peso del bundle empeoran. Es la única forma de que el resto no se degrade.
3. **RUM (30)** y **tracing (18)** — ambos son decisiones de proveedor/coste, no código pendiente.
4. **`Cache-Control` para `public/` (27)** — menor; los isotypes cambian poco y pesan ~10 KB.

Lo demás de la lista ya está implementado o no aplica a esta app.
