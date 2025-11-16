export type Permission = "view" | "edit" | "none"

// Dynamic permission matrix stored in memory (would be in DB in production)
let dynamicRoles: string[] = ["admin", "pm", "developer", "qa", "client"]
const dynamicModules: string[] = [
  "backlog",
  "githubMetrics",
  "togglHours",
  "taskAssignment",
  "qaManagement",
  "statusReports",
  "warranty",
  "documentation",
  "calendarSync",
  "projectSettings",
  "aiGenerator",
  "financeDashboard",
  "financeClients",
  "financeInvoices",
  "financeComplements",
  "financeExpenses",
  "financePayroll",
  "financeReports",
]

// Dynamic permissions matrix
const dynamicPermissions: Record<string, Record<string, Permission>> = {
  admin: {
    backlog: "edit",
    githubMetrics: "edit",
    togglHours: "edit",
    taskAssignment: "edit",
    qaManagement: "edit",
    statusReports: "edit",
    warranty: "edit",
    documentation: "edit",
    calendarSync: "edit",
    projectSettings: "edit",
    aiGenerator: "edit",
    financeDashboard: "edit",
    financeClients: "edit",
    financeInvoices: "edit",
    financeComplements: "edit",
    financeExpenses: "edit",
    financePayroll: "edit",
    financeReports: "edit",
  },
  pm: {
    backlog: "edit",
    githubMetrics: "view",
    togglHours: "view",
    taskAssignment: "edit",
    qaManagement: "edit",
    statusReports: "edit",
    warranty: "edit",
    documentation: "edit",
    calendarSync: "edit",
    projectSettings: "view",
    aiGenerator: "edit",
    financeDashboard: "view",
    financeClients: "view",
    financeInvoices: "view",
    financeComplements: "view",
    financeExpenses: "view",
    financePayroll: "none",
    financeReports: "view",
  },
  developer: {
    backlog: "view",
    githubMetrics: "view",
    togglHours: "view",
    taskAssignment: "none",
    qaManagement: "view",
    statusReports: "none",
    warranty: "view",
    documentation: "view",
    calendarSync: "view",
    projectSettings: "none",
    aiGenerator: "none",
    financeDashboard: "none",
    financeClients: "none",
    financeInvoices: "none",
    financeComplements: "none",
    financeExpenses: "none",
    financePayroll: "none",
    financeReports: "none",
  },
  qa: {
    backlog: "view",
    githubMetrics: "none",
    togglHours: "none",
    taskAssignment: "none",
    qaManagement: "edit",
    statusReports: "none",
    warranty: "view",
    documentation: "view",
    calendarSync: "view",
    projectSettings: "none",
    aiGenerator: "none",
    financeDashboard: "none",
    financeClients: "none",
    financeInvoices: "none",
    financeComplements: "none",
    financeExpenses: "none",
    financePayroll: "none",
    financeReports: "none",
  },
  client: {
    backlog: "none",
    githubMetrics: "none",
    togglHours: "none",
    taskAssignment: "none",
    qaManagement: "none",
    statusReports: "view",
    warranty: "view",
    documentation: "view",
    calendarSync: "none",
    projectSettings: "none",
    aiGenerator: "none",
    financeDashboard: "none",
    financeClients: "none",
    financeInvoices: "none",
    financeComplements: "none",
    financeExpenses: "none",
    financePayroll: "none",
    financeReports: "none",
  },
}

// Module labels for UI
export const moduleLabels: Record<string, string> = {
  backlog: "Backlog Scrum",
  githubMetrics: "Métricas GitHub",
  togglHours: "Horas Toggl",
  taskAssignment: "Asignación de Tasks",
  qaManagement: "Gestión QA",
  statusReports: "Status Reports",
  warranty: "Garantía",
  documentation: "Documentación",
  calendarSync: "Sincronización Calendar",
  projectSettings: "Configuración Proyecto",
  aiGenerator: "Generador IA",
  financeDashboard: "Dashboard Finanzas",
  financeClients: "Clientes",
  financeInvoices: "Facturas",
  financeComplements: "Complementos de Pago",
  financeExpenses: "Egresos",
  financePayroll: "Nómina",
  financeReports: "Reportes Financieros",
}

// Get all roles
export function getRoles(): string[] {
  return [...dynamicRoles]
}

// Get all modules
export function getModules(): string[] {
  return [...dynamicModules]
}

// Get permissions matrix
export function getPermissionsMatrix(): Record<string, Record<string, Permission>> {
  return JSON.parse(JSON.stringify(dynamicPermissions))
}

// Add new role
export function addRole(roleName: string): void {
  if (dynamicRoles.includes(roleName)) {
    throw new Error(`Role ${roleName} already exists`)
  }

  dynamicRoles.push(roleName)

  // Initialize permissions for new role (none by default except admin)
  dynamicPermissions[roleName] = {}
  dynamicModules.forEach((module) => {
    dynamicPermissions[roleName][module] = "none"
  })
}

// Add new module
export function addModule(moduleKey: string, moduleLabel: string): void {
  if (dynamicModules.includes(moduleKey)) {
    throw new Error(`Module ${moduleKey} already exists`)
  }

  dynamicModules.push(moduleKey)
  moduleLabels[moduleKey] = moduleLabel

  // Add module to all roles with default permissions
  dynamicRoles.forEach((role) => {
    if (role === "admin") {
      dynamicPermissions[role][moduleKey] = "edit"
    } else {
      dynamicPermissions[role][moduleKey] = "none"
    }
  })
}

// Update permission
export function updatePermission(role: string, module: string, permission: Permission): void {
  if (!dynamicRoles.includes(role)) {
    throw new Error(`Role ${role} does not exist`)
  }
  if (!dynamicModules.includes(module)) {
    throw new Error(`Module ${module} does not exist`)
  }

  dynamicPermissions[role][module] = permission
}

// Delete role
export function deleteRole(roleName: string): void {
  if (roleName === "admin") {
    throw new Error("Cannot delete admin role")
  }

  dynamicRoles = dynamicRoles.filter((r) => r !== roleName)
  delete dynamicPermissions[roleName]
}

// Helper to verify permissions
export function hasPermission(role: string, module: string, requiredPermission: "view" | "edit"): boolean {
  if (!dynamicPermissions[role] || !dynamicPermissions[role][module]) {
    return false
  }

  const userPermission = dynamicPermissions[role][module]

  if (userPermission === "none") return false
  if (requiredPermission === "view") return userPermission === "view" || userPermission === "edit"
  if (requiredPermission === "edit") return userPermission === "edit"

  return false
}

// Helper to get permission level
export function getPermission(role: string, module: string): Permission {
  if (!dynamicPermissions[role] || !dynamicPermissions[role][module]) {
    return "none"
  }
  return dynamicPermissions[role][module]
}
