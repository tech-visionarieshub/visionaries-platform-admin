/**
 * Tipos TypeScript para el sistema de Tareas del Equipo
 */

export type TeamTaskStatus = 
  | 'pending'
  | 'in-progress'
  | 'review'
  | 'completed'
  | 'cancelled'

export type TeamTaskPriority = 
  | 'high'
  | 'medium'
  | 'low'

export const TEAM_TASK_CATEGORIES = [
  'Propuestas',
  'Startups',
  'Evolution',
  'Pathway',
  'Desarrollo',
  'QA',
  'Portal Admin',
  'Aura',
  'Redes Sociales',
  'Conferencias',
  'Inversión',
  'Pagos',
  'Otra'
] as const

export type TeamTaskCategory = typeof TEAM_TASK_CATEGORIES[number]

export interface TeamTask {
  id: string
  title: string
  description?: string
  category: TeamTaskCategory
  customCategory?: string  // Solo si category === 'Otra'
  status: TeamTaskStatus
  priority: TeamTaskPriority
  assignee?: string
  projectId?: string
  projectName?: string
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
  startedAt?: Date
  accumulatedTime?: number
  comentarios?: string
  trelloCardId?: string  // ID de la tarjeta de Trello para evitar duplicados
  assignmentEmailSent?: boolean  // Indica si se envió el correo de asignación
  assignmentEmailSentAt?: Date  // Fecha en que se envió el correo de asignación
  createdAt: Date
  updatedAt: Date
  createdBy: string
}



