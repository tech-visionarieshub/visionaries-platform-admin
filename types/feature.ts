/**
 * Tipos TypeScript para el sistema de Features (Funcionalidades)
 */

export type FeatureStatus = 
  | 'backlog'
  | 'todo'
  | 'in-progress'
  | 'review'
  | 'done'
  | 'completed'

export type FeaturePriority = 
  | 'high'
  | 'medium'
  | 'low'

export type FeatureType = "Funcionalidad" | "QA" | "Bug"
export type FeatureCategory = "Funcionalidad" | "QA" | "Bugs Generales" | "Otra"

export interface Feature {
  id: string
  projectId: string
  epicTitle: string        // REQUERIDO - Categorización por Epic
  title: string            // Título de la funcionalidad
  description: string      // Descripción detallada (información técnica, contexto)
  criteriosAceptacion?: string  // Criterios de aceptación (se copiarán a QA task)
  comentarios?: string    // Comentarios/notas (se copiarán a QA task)
  tipo?: FeatureType      // Tipo: Funcionalidad/QA/Bug (se copiará a QA task)
  categoria?: FeatureCategory  // Categoría (se copiará a QA task, por defecto "Funcionalidad")
  status: FeatureStatus
  priority: FeaturePriority
  assignee?: string
  estimatedHours?: number
  actualHours?: number
  startedAt?: Date        // Timestamp de inicio del timer actual
  accumulatedTime?: number   // Tiempo acumulado en segundos hasta la última pausa
  githubBranch?: string
  commits?: number
  storyPoints?: number
  sprint?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  qaTaskId?: string        // Referencia a la tarea QA creada
}

