/**
 * Tipos TypeScript para el sistema de QA Tasks
 */

export type QATaskCategory = 
  | "Funcionalidades Nuevas"
  | "QA"
  | "Bugs Generales"
  | "Otra"

export type QATaskStatus = 
  | "Pendiente"
  | "En Progreso"
  | "Completado"
  | "Bloqueado"
  | "Cancelado"

export type QATaskType = 
  | "Funcionalidad"
  | "QA"
  | "Bug"

export type QATaskPriority = 
  | "Alta"
  | "Media"
  | "Baja"

export interface QAImage {
  url: string
  name: string
  uploadedAt: Date | string
  size: number
}

export interface QATask {
  id: string
  titulo: string
  categoria: QATaskCategory
  tipo: QATaskType
  criterios_aceptacion: string
  comentarios: string
  imagenes: QAImage[]
  estado: QATaskStatus
  prioridad?: QATaskPriority
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
  projectId: string
}

export interface CSVColumnMapping {
  column: string
  field: string | null
  confidence?: number
}

export interface CSVAnalysisResult {
  headers: string[]
  suggestedMappings: CSVColumnMapping[]
  sampleRows: Record<string, any>[]
}
