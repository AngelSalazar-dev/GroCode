/**
 * Normalizacion de email en un unico sitio.
 *
 * MySQL (el motor anterior) usaba `utf8mb4_unicode_ci`, que hace que
 * "Ana@x.com" y "ana@x.com" sean la MISMA fila. Postgres no: son dos cuentas
 * distintas, y la segunda no podria entrar porque el login normaliza a minusculas
 * antes de buscar.
 *
 * Ese comportamiento estaba escondido en la collation del servidor, no en el
 * codigo, asi que cualquier via que insertara un usuario sin pasar por el
 * formulario (el seed, un script, el OAuth de GitHub) dependedia de que el
 * motor tapara el error. Con Postgres dejaria de estar tapado.
 *
 * La regla es simple: **todo email que se guarde o se busque pasa por aqui**.
 */

/** Como se guarda y como se busca: siempre minusculas y sin espacios. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}