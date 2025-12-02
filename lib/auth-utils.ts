/**
 * Utilidades de autenticación y autorización
 * Funciones puras para verificar permisos de usuario
 */

/**
 * Rutas que requieren ser admin (no solo superadmin)
 * Estas rutas están completamente bloqueadas para usuarios que no son admin
 */
const ADMIN_ONLY_ROUTES = ['/crm', '/finanzas', '/cotizaciones', '/reports']

/**
 * Verifica si una ruta requiere ser admin
 */
export function requiresAdminAccess(path: string): boolean {
  return ADMIN_ONLY_ROUTES.some(adminRoute => path.startsWith(adminRoute))
}

/**
 * Verifica si un usuario es superadmin
 * IMPORTANTE: Esta función debe estar definida antes de isAdmin
 */
export function isSuperAdmin(email?: string, claims?: Record<string, any>): boolean {
  // Verificar por email específico
  if (email === 'adminplatform@visionarieshub.com') {
    return true
  }
  
  // Verificar por custom claim
  if (claims?.superadmin === true) {
    return true
  }
  
  return false
}

/**
 * Verifica si un usuario es admin (incluye superadmin)
 */
export function isAdmin(email?: string, claims?: Record<string, any>, role?: string): boolean {
  // Superadmin siempre es admin
  if (isSuperAdmin(email, claims)) {
    return true
  }
  
  // Verificar por role
  if (role === 'admin' || claims?.role === 'admin') {
    return true
  }
  
  return false
}

/**
 * Verifica si un usuario es admin basado en datos del store de Zustand
 * Versión simplificada para usar en componentes React
 */
export function isUserAdmin(user: { superadmin?: boolean; role?: string } | null): boolean {
  if (!user) return false
  return user.superadmin === true || user.role === 'admin'
}

