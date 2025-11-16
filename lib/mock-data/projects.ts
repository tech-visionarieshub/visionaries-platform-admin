export type Project = {
  id: string
  name: string
  client: string
  clientId: string
  status: "En desarrollo" | "QA" | "Garantía" | "Finalizado"
  progress: number
  startDate: string
  endDate: string
  responsible: string
  features: number
  completedFeatures: number
  budget: number
  hoursEstimated: number
  hoursWorked: number
  description?: string
  cotizacionId?: string
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Plataforma E-commerce",
    client: "TechCorp Solutions",
    clientId: "1",
    status: "En desarrollo",
    progress: 65,
    startDate: "2025-01-15",
    endDate: "2025-04-30",
    responsible: "Carlos Ramirez",
    features: 24,
    completedFeatures: 16,
    budget: 150000,
    hoursEstimated: 400,
    hoursWorked: 260,
    description: "Desarrollo de plataforma e-commerce completa con carrito, pagos y panel admin",
    cotizacionId: "C1",
  },
  {
    id: "2",
    name: "App Móvil Delivery",
    client: "Innovatech SA",
    clientId: "2",
    status: "QA",
    progress: 85,
    startDate: "2024-11-01",
    endDate: "2025-02-28",
    responsible: "Ana García",
    features: 18,
    completedFeatures: 15,
    budget: 120000,
    hoursEstimated: 320,
    hoursWorked: 310,
    description: "Aplicación móvil para delivery de comida con tracking en tiempo real",
    cotizacionId: "C2",
  },
  {
    id: "3",
    name: "Sistema CRM Interno",
    client: "Digital Systems",
    clientId: "3",
    status: "Garantía",
    progress: 100,
    startDate: "2024-08-01",
    endDate: "2024-12-15",
    responsible: "Luis Torres",
    features: 32,
    completedFeatures: 32,
    budget: 200000,
    hoursEstimated: 500,
    hoursWorked: 520,
    description: "Sistema CRM personalizado para gestión de leads y clientes",
    cotizacionId: "C3",
  },
  {
    id: "4",
    name: "Portal de Clientes",
    client: "TechCorp Solutions",
    clientId: "1",
    status: "En desarrollo",
    progress: 45,
    startDate: "2025-02-01",
    endDate: "2025-06-30",
    responsible: "María López",
    features: 28,
    completedFeatures: 13,
    budget: 180000,
    hoursEstimated: 450,
    hoursWorked: 203,
    description: "Portal web para que clientes gestionen sus cuentas y servicios",
    cotizacionId: "C4",
  },
]

export function getProjects(): Project[] {
  return mockProjects
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id)
}

export function addProject(project: Project): void {
  mockProjects.push(project)
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const index = mockProjects.findIndex((p) => p.id === id)
  if (index !== -1) {
    mockProjects[index] = { ...mockProjects[index], ...updates }
  }
}
