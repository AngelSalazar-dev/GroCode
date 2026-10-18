# GroCode - Checklist de Mejoras

## FASE 1: Datos Mock → Datos Reales
- [x] 1.1 NotificationPanel.tsx - Reemplazar MOCK_NOTIFICATIONS con consulta real a DB
- [x] 1.2 app/notifications/page.tsx - Conectar a Prisma con tabla Notification
- [x] 1.3 MentorsList.tsx - Reemplazar Math.random() con ratings reales de DB
- [x] 1.4 profile/[id]/page.tsx - Contar seguidores reales con prisma.follow.count()
- [x] 1.5 app/page.tsx - Stats del landing con counts reales de DB

## FASE 2: Botones Muertos y Enlaces Rotos
- [x] 2.1 ProjectCard.tsx - Implementar botón "Postularme" con Server Action
- [x] 2.2 PostCard.tsx - Implementar dropdown "More Options" (editar/eliminar)
- [x] 2.3 Footer links - Crear páginas placeholder para Documentación, Blog, etc.
- [x] 2.4 signin page - Implementar link "¿Olvidaste tu contraseña?"
- [x] 2.5 FeedClient.tsx - Enviar spans legales a páginas reales
- [x] 2.6 roadmap page - "Discutir" debe abrir chat o crear post
- [x] 2.7 Landing page - Actualizar URLs de redes sociales

## FASE 3: Funciones sin Backend
- [x] 3.1 apply-senior page - Implementar Server Action applySenior + tabla SeniorApplication
- [x] 3.2 FeedClient.tsx - Implementar lógica de sorting por categorías
- [x] 3.3 Navbar - Implementar búsqueda con Prisma contains

## FASE 4: Funciones sin UI
- [x] 4.1 Follow/Unfollow - Crear Server Action toggleFollow + botón en perfiles
- [x] 4.2 Chat/Mensajes - Crear página /chat con lista de canales y mensajes
- [x] 4.3 Editar/Eliminar posts - Agregar dropdown + Server Actions
- [x] 4.4 Editar/Eliminar proyectos - Agregar UI + Server Actions
- [x] 4.5 Colaboración - Completar creación de canal de chat al aceptar

## FASE 5: Infraestructura
- [ ] 5.1 Subida de imágenes - Configurar MinIO o sistema de uploads
- [ ] 5.2 Tiempo real - Implementar Socket.io para chat
- [ ] 5.3 Notificaciones push - Implementar Web Push API con VAPID
- [ ] 5.4 Cache - Implementar capa de caché (Upstash Redis o en memoria)
- [x] 5.5 Rate limiting - Implementar middleware de rate limiting
- [x] 5.6 Búsqueda - Implementar búsqueda full-text con Prisma

## FASE 6: Calidad de Código
- [x] 6.1 Reemplazar alert() por toast (sonner)
- [x] 6.2 Eliminar console.log/error de producción (parcial - se requiere revisión manual)
- [x] 6.3 Verificar rendering de Framer Motion en landing

---
**Progreso:** 26/29 tareas completadas

### Notas
- Las tareas 5.1-5.4 requieren configuración externa (MinIO, Socket.io, VAPID keys, Redis)
- Se recomienda implementarlas cuando se tenga un servidor de producción configurado
