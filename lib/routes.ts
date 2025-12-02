/**
 * Lista de todas las rutas disponibles en el Portal Admin
 * Organizadas por categorías para facilitar la selección
 */

/**
 * Importar funciones de autenticación desde auth-utils
 * Esto evita problemas de inicialización de módulos
 */
import { isSuperAdmin, isAdmin, requiresAdminAccess } from './auth-utils'

export interface PortalRoute {
  path: string
  label: string
  category: string
  description?: string
}

export const PORTAL_ROUTES: PortalRoute[] = [
  // Dashboard / Home
  {
    path: '/',
    label: 'Dashboard Principal',
    category: 'General',
    description: 'Página principal del portal'
  },

  // CRM
  {
    path: '/crm/dashboard',
    label: 'CRM - Dashboard',
    category: 'CRM',
    description: 'Dashboard del CRM'
  },
  {
    path: '/crm/kanban',
    label: 'CRM - Kanban',
    category: 'CRM',
    description: 'Vista Kanban de leads'
  },
  {
    path: '/crm/leads',
    label: 'CRM - Leads',
    category: 'CRM',
    description: 'Gestión de leads'
  },
  {
    path: '/crm/leads/new',
    label: 'CRM - Nuevo Lead',
    category: 'CRM',
    description: 'Crear nuevo lead'
  },
  {
    path: '/crm/reports',
    label: 'CRM - Reportes',
    category: 'CRM',
    description: 'Reportes del CRM'
  },

  // Finanzas
  {
    path: '/finanzas/dashboard',
    label: 'Finanzas - Dashboard',
    category: 'Finanzas',
    description: 'Dashboard de finanzas'
  },
  {
    path: '/finanzas/clientes',
    label: 'Finanzas - Clientes',
    category: 'Finanzas',
    description: 'Gestión de clientes'
  },
  {
    path: '/finanzas/facturas',
    label: 'Finanzas - Facturas',
    category: 'Finanzas',
    description: 'Gestión de facturas'
  },
  {
    path: '/finanzas/complementos',
    label: 'Finanzas - Complementos',
    category: 'Finanzas',
    description: 'Complementos de pago'
  },
  {
    path: '/finanzas/egresos',
    label: 'Finanzas - Egresos',
    category: 'Finanzas',
    description: 'Gestión de egresos'
  },
  {
    path: '/finanzas/nomina',
    label: 'Finanzas - Nómina',
    category: 'Finanzas',
    description: 'Gestión de nómina'
  },
  {
    path: '/finanzas/reportes',
    label: 'Finanzas - Reportes',
    category: 'Finanzas',
    description: 'Reportes financieros'
  },

  // Cotizaciones
  {
    path: '/cotizaciones',
    label: 'Cotizaciones - Lista',
    category: 'Cotizaciones',
    description: 'Lista de cotizaciones'
  },
  {
    path: '/cotizaciones/nueva',
    label: 'Cotizaciones - Nueva',
    category: 'Cotizaciones',
    description: 'Crear nueva cotización'
  },
  {
    path: '/cotizaciones/templates',
    label: 'Cotizaciones - Templates',
    category: 'Cotizaciones',
    description: 'Templates de cotizaciones'
  },
  {
    path: '/cotizaciones/reportes',
    label: 'Cotizaciones - Reportes',
    category: 'Cotizaciones',
    description: 'Reportes de cotizaciones'
  },

  // Proyectos
  {
    path: '/projects',
    label: 'Proyectos - Lista',
    category: 'Proyectos',
    description: 'Lista de proyectos'
  },
  {
    path: '/projects/new',
    label: 'Proyectos - Nuevo',
    category: 'Proyectos',
    description: 'Crear nuevo proyecto'
  },
  // Rutas dinámicas de proyectos (se validan con patrón)
  {
    path: '/projects/[id]',
    label: 'Proyectos - Detalle',
    category: 'Proyectos',
    description: 'Detalle de proyecto (acceso a todos los proyectos)'
  },
  {
    path: '/projects/[id]/backlog',
    label: 'Proyectos - Backlog',
    category: 'Proyectos',
    description: 'Backlog del proyecto'
  },
  {
    path: '/projects/[id]/timeline',
    label: 'Proyectos - Timeline',
    category: 'Proyectos',
    description: 'Cronograma del proyecto'
  },
  {
    path: '/projects/[id]/team',
    label: 'Proyectos - Equipo',
    category: 'Proyectos',
    description: 'Equipo del proyecto'
  },
  {
    path: '/projects/[id]/github',
    label: 'Proyectos - GitHub',
    category: 'Proyectos',
    description: 'Integración GitHub'
  },
  {
    path: '/projects/[id]/toggl',
    label: 'Proyectos - Toggl',
    category: 'Proyectos',
    description: 'Horas trabajadas (Toggl)'
  },
  {
    path: '/projects/[id]/qa',
    label: 'Proyectos - QA',
    category: 'Proyectos',
    description: 'Control de calidad'
  },
  {
    path: '/projects/[id]/status',
    label: 'Proyectos - Status Cliente',
    category: 'Proyectos',
    description: 'Status para el cliente'
  },
  {
    path: '/projects/[id]/calendar',
    label: 'Proyectos - Calendar',
    category: 'Proyectos',
    description: 'Calendario del proyecto'
  },
  {
    path: '/projects/[id]/deliverables',
    label: 'Proyectos - Entregas',
    category: 'Proyectos',
    description: 'Entregables del proyecto'
  },
  {
    path: '/projects/[id]/documentation',
    label: 'Proyectos - Documentación',
    category: 'Proyectos',
    description: 'Documentación del proyecto'
  },
  {
    path: '/projects/[id]/warranty',
    label: 'Proyectos - Garantía',
    category: 'Proyectos',
    description: 'Garantía del proyecto'
  },
  {
    path: '/projects/[id]/finanzas',
    label: 'Proyectos - Finanzas',
    category: 'Proyectos',
    description: 'Finanzas del proyecto'
  },
  {
    path: '/projects/[id]/ai-generator',
    label: 'Proyectos - IA Generator',
    category: 'Proyectos',
    description: 'Generador de IA'
  },

  // Reportes Generales
  {
    path: '/reports',
    label: 'Reportes Generales',
    category: 'Reportes',
    description: 'Reportes generales del portal'
  },

  // Configuración
  {
    path: '/settings',
    label: 'Configuración',
    category: 'Configuración',
    description: 'Configuración del portal'
  },
]

/**
 * Obtiene todas las categorías únicas de rutas
 */
export function getRouteCategories(): string[] {
  return Array.from(new Set(PORTAL_ROUTES.map(route => route.category)))
}

/**
 * Obtiene rutas agrupadas por categoría
 */
export function getRoutesByCategory(): Record<string, PortalRoute[]> {
  return PORTAL_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = []
    }
    acc[route.category].push(route)
    return acc
  }, {} as Record<string, PortalRoute[]>)
}

/**
 * Verifica si una ruta coincide con un patrón (para rutas dinámicas)
 */
export function routeMatches(pattern: string, actualPath: string): boolean {
  // Si es exacto, comparar directamente
  if (pattern === actualPath) {
    return true
  }

  // Si el patrón termina con una ruta base (ej: /projects), verificar si actualPath comienza con ella
  // Esto permite que /projects cubra /projects/[id] y todas sus subrutas
  if (actualPath.startsWith(pattern + '/') || actualPath === pattern) {
    return true
  }

  // Si el patrón tiene [id], convertirlo a regex
  const regexPattern = pattern.replace(/\[id\]/g, '[^/]+')
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(actualPath)
}

/**
 * Rutas que siempre están disponibles para usuarios con acceso interno
 * Estas rutas no requieren estar en allowedRoutes
 */
const ALWAYS_ALLOWED_ROUTES = ['/settings', '/login', '/']

/**
 * Verifica si un usuario tiene acceso a una ruta específica
 */
export function hasRouteAccess(
  allowedRoutes: string[], 
  currentPath: string, 
  userEmail?: string,
  userClaims?: Record<string, any>,
  userRole?: string
): boolean {
  // Superadmin tiene acceso a todo (pasado y futuro)
  if (isSuperAdmin(userEmail, userClaims)) {
    return true
  }

  // Verificar si la ruta requiere ser admin
  if (requiresAdminAccess(currentPath)) {
    // Si requiere admin, verificar que el usuario sea admin
    if (!isAdmin(userEmail, userClaims, userRole)) {
      return false
    }
  }

  // Rutas que siempre están permitidas para usuarios internos
  if (ALWAYS_ALLOWED_ROUTES.includes(currentPath)) {
    return true
  }

  // Si tiene acceso a todas las rutas (wildcard)
  if (allowedRoutes.includes('*') || allowedRoutes.includes('/')) {
    return true
  }

  // Verificar si la ruta actual coincide con alguna ruta permitida
  return allowedRoutes.some(allowedRoute => {
    // Si la ruta permitida es exacta
    if (allowedRoute === currentPath) {
      return true
    }

    // Si la ruta permitida es un patrón (ej: /projects/[id])
    return routeMatches(allowedRoute, currentPath)
  })
}

