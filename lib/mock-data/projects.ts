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

export const mockProjects: Project[] = []

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
