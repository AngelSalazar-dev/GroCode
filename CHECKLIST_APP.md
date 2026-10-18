# GroCodeApp - Checklist de Mejoras

## FASE 1: Fundamentos
- [x] 1.1 lib/api.ts - Variables de entorno para BASE_URL (no hardcodear IP)
- [x] 1.2 lib/api.ts - Auto-logout en 401 (interceptor)
- [x] 1.3 lib/api.ts - Manejo de errores con Alert/Toast
- [x] 1.4 AuthContext - Validación de email y password en register
- [x] 1.5 AuthContext - Manejo de token expirado

## FASE 2: Features Core
- [x] 2.1 PostCard - Persistir likes en API (toggleLike)
- [x] 2.2 PostCard - Persistir bookmarks en API (toggleBookmark)
- [x] 2.3 PostCard - Abrir pantalla de comentarios al tocar comment
- [x] 2.4 PostCard - Corregir resourceUrl (no siempre es imagen)
- [x] 2.5 Feed - Agregar paginación con scroll infinito

## FASE 3: Pantallas Faltantes
- [x] 3.1 Crear pantalla de perfil de mentor (/mentor/[id])
- [x] 3.2 Crear pantalla de comentarios del post (/post/[id])
- [x] 3.3 Crear pantalla de editar perfil (/profile/edit)
- [x] 3.4 Crear pantalla de buscar (/search)
- [x] 3.5 Conectar tarjeta de mentor a pantalla de mentor

## FASE 4: Conexiones API
- [x] 4.1 Conectar chat con API real
- [x] 4.2 Conectar notificaciones con API real
- [x] 4.3 Agregar pull-to-refresh en mentoría
- [x] 4.4 Agregar infinite scroll en mentoría

## FASE 5: APIs Faltantes
- [x] 5.1 Crear endpoint /api/users/[id]
- [x] 5.2 Crear endpoint /api/users/[id]/follow
- [x] 5.3 Crear endpoint /api/users/me
- [x] 5.4 Crear endpoint /api/posts/[id]/like
- [x] 5.5 Crear endpoint /api/posts/[id]/bookmark

## FASE 6: UI/UX Mejoras
- [x] 6.1 Crear hook useKeyboard
- [x] 6.2 Mejorar empty states
- [x] 6.3 Agregar loading states

## FASE 7: APIs de Chat y Notificaciones
- [x] 7.1 Crear endpoint /api/chat/channels
- [x] 7.2 Crear endpoint /api/chat/[id]/messages
- [x] 7.3 Crear endpoint /api/notifications
- [x] 7.4 Crear endpoint /api/search

## FASE 8: Verificación
- [x] 8.1 Verificar TypeScript compile
- [x] 8.2 Actualizar CHECKLIST_APP.md

---
**Progreso:** 24/24 tareas completadas
