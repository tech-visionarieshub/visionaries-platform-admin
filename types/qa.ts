/**
 * Tipos TypeScript para el sistema de QA Tasks
 */

export type QATaskCategory = 
  | "Funcionalidad"
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

export interface QAImage {
  url: string
  name: string
  uploadedAt: Date
  size: number
}

export interface QATask {
  id: string
  titulo: string
  categoria: QATaskCategory
  tipo: string
  criterios_aceptacion: string
  comentarios: string
  imagenes: QAImage[]
  estado: QATaskStatus
  createdAt: Date
  updatedAt: Date
  createdBy: string
  projectId: string
  featureId?: string       // ID de la funcionalidad de origen
  featureTitle?: string    // Título de la funcionalidad (para mostrar)
  featureNote?: string     // Anotación cuando no hay funcionalidad
}

export interface CSVColumnMapping {
  columnName: string
  mappedField: keyof QATask | "comentarios" | null
  confidence?: number
}

export interface AnalyzeFileResponse {
  headers: string[]
  suggestedMappings: CSVColumnMapping[]
  sampleRows: Record<string, any>[]
}

export interface GenerateCriteriaRequest {
  titulo: string
  categoria?: QATaskCategory
  tipo?: string
  comentarios?: string
}

export interface GenerateCriteriaResponse {
  criteria: string
}

export interface CSVAnalysisResult {
  success: boolean
  headers: string[]
  suggestedMappings: CSVColumnMapping[]
  sampleRows: Record<string, any>[]
}
