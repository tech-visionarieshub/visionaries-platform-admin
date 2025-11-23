/**
 * Servicio para interactuar con OpenAI API
 * - Análisis de headers CSV/Excel
 * - Generación de criterios de aceptación
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import type { CSVColumnMapping, AnalyzeFileResponse, GenerateCriteriaRequest } from '@/types/qa'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class OpenAIService {
  private db = getInternalFirestore()
  private configCollection = this.db.collection('config')

  /**
   * Obtiene la API key de OpenAI desde Firestore
   */
  private async getApiKey(): Promise<string> {
    const doc = await this.configCollection.doc('openai').get()
    
    if (!doc.exists) {
      throw new Error('OpenAI API key no está configurada. Ve a Settings para configurarla.')
    }

    const data = doc.data()
    if (!data?.apiKey) {
      throw new Error('OpenAI API key no está configurada. Ve a Settings para configurarla.')
    }

    return data.apiKey
  }

  /**
   * Analiza headers de CSV/Excel y sugiere mapeo a campos QA
   */
  async analyzeCSVHeaders(headers: string[], sampleRows: Record<string, any>[]): Promise<AnalyzeFileResponse> {
    const apiKey = await this.getApiKey()

    // Construir prompt para OpenAI
    const prompt = `Analiza los siguientes headers de un archivo CSV/Excel de tareas QA y sugiere cómo mapearlos a los campos estándar de QA.

Headers encontrados: ${headers.join(', ')}

Campos QA estándar disponibles (usa estos nombres exactos):
- "id": ID único de la tarea
- "titulo": Título/Descripción breve de la tarea
- "categoria": Categoría de la tarea ("Funcionalidades Nuevas", "QA", "Bugs Generales", o "Otra")
- "tipo": Tipo de tarea ("Funcionalidad", "QA", o "Bug")
- "criterios_aceptacion": Criterios de aceptación o estado deseado
- "estado": Estado de la tarea ("Pendiente", "En Progreso", "Completado", "Bloqueado", "Cancelado")
- "comentarios": Cualquier otro contenido que no mapee a los campos anteriores

Ejemplos de filas:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Responde SOLO con un JSON válido en este formato exacto:
{
  "mappings": [
    {
      "column": "nombre_de_columna",
      "field": "campo_qa" o null,
      "confidence": 0.0-1.0
    }
  ]
}

IMPORTANTE:
- Usa los nombres exactos de los campos: "id", "titulo", "categoria", "tipo", "criterios_aceptacion", "estado", "comentarios"
- Si una columna no mapea claramente a ningún campo, usa null como field
- confidence debe ser un número entre 0.0 y 1.0 indicando qué tan seguro estás del mapeo`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente experto en análisis de datos y mapeo de columnas. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(`OpenAI API error: ${error.error?.message || 'Error desconocido'}`)
      }

      const data: OpenAIResponse = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      // Parsear JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Respuesta de OpenAI no contiene JSON válido')
      }

      const parsed = JSON.parse(jsonMatch[0])
      // Mapear de {column, field, confidence} a {columnName, mappedField, confidence}
      const mappings: CSVColumnMapping[] = (parsed.mappings || []).map((m: any) => ({
        columnName: m.column || m.columnName || '',
        mappedField: m.field || m.mappedField || null,
        confidence: m.confidence || 0.5,
      }))

      return {
        headers,
        suggestedMappings: mappings,
        sampleRows: sampleRows.slice(0, 5), // Limitar a 5 filas de ejemplo
      }
    } catch (error: any) {
      console.error('[OpenAI Service] Error analizando headers:', error)
      throw new Error(`Error al analizar headers: ${error.message}`)
    }
  }

  /**
   * Analiza headers de CSV/Excel y sugiere mapeo a campos de Features
   */
  async analyzeCSVHeadersForFeatures(headers: string[], sampleRows: Record<string, any>[]): Promise<{
    headers: string[]
    suggestedMappings: Array<{
      columnName: string
      mappedField: string | null
      confidence?: number
    }>
    sampleRows: Record<string, any>[]
  }> {
    const apiKey = await this.getApiKey()

    // Construir prompt para OpenAI
    const prompt = `Analiza los siguientes headers de un archivo CSV/Excel de funcionalidades y sugiere cómo mapearlos a los campos estándar de Features.

Headers encontrados: ${headers.join(', ')}

Campos Feature estándar disponibles (usa estos nombres exactos):
- "epicTitle": Título del Epic (REQUERIDO) - Categorización principal (ej: "Sistema de Autenticación", "Dashboard Analytics")
- "title": Título de la funcionalidad (REQUERIDO)
- "description": Descripción detallada de la funcionalidad (información técnica, contexto)
- "criteriosAceptacion": Criterios de aceptación (se copiarán automáticamente a la tarea QA cuando se complete)
- "comentarios": Comentarios/notas (se copiarán automáticamente a la tarea QA cuando se complete)
- "tipo": Tipo de funcionalidad ("Funcionalidad", "QA", "Bug") - se copiará a QA task
- "categoria": Categoría ("Funcionalidad", "QA", "Bugs Generales", "Otra") - se copiará a QA task
- "priority": Prioridad ("high", "medium", "low")
- "assignee": Persona asignada
- "estimatedHours": Horas estimadas (número)
- "actualHours": Horas reales trabajadas (número)
- "storyPoints": Puntos de historia (número)
- "sprint": Sprint asignado (string)

NOTA IMPORTANTE:
- Las columnas que contengan "criterio", "aceptación", "estado deseado", "requisito" o "requirement" se guardarán automáticamente en "criteriosAceptacion", aunque no se mapeen explícitamente.
- Las columnas que contengan "comentario", "nota", "observación" o "comment" se guardarán automáticamente en "comentarios", aunque no se mapeen explícitamente.
- Las demás columnas no mapeadas irán a "description" como información adicional.

Ejemplos de filas:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Responde SOLO con un JSON válido en este formato exacto:
{
  "mappings": [
    {
      "column": "nombre_de_columna",
      "field": "campo_feature" o null,
      "confidence": 0.0-1.0
    }
  ]
}

IMPORTANTE:
- Usa los nombres exactos de los campos: "epicTitle", "title", "description", "priority", "assignee", "estimatedHours", "actualHours", "storyPoints", "sprint"
- "epicTitle" es REQUERIDO - si no hay columna obvia, sugiere mapear la columna más cercana o null si realmente no hay
- Si una columna no mapea claramente a ningún campo, usa null como field
- confidence debe ser un número entre 0.0 y 1.0 indicando qué tan seguro estás del mapeo`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente experto en análisis de datos y mapeo de columnas. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(`OpenAI API error: ${error.error?.message || 'Error desconocido'}`)
      }

      const data: OpenAIResponse = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      // Parsear JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Respuesta de OpenAI no contiene JSON válido')
      }

      const parsed = JSON.parse(jsonMatch[0])
      // Mapear de {column, field, confidence} a {columnName, mappedField, confidence}
      const mappings = (parsed.mappings || []).map((m: any) => ({
        columnName: m.column || m.columnName || '',
        mappedField: m.field || m.mappedField || null,
        confidence: m.confidence || 0.5,
      }))

      return {
        headers,
        suggestedMappings: mappings,
        sampleRows: sampleRows.slice(0, 5), // Limitar a 5 filas de ejemplo
      }
    } catch (error: any) {
      console.error('[OpenAI Service] Error analizando headers de Features:', error)
      throw new Error(`Error al analizar headers: ${error.message}`)
    }
  }

  /**
   * Genera criterios de aceptación basados en título y descripción
   */
  async generateAcceptanceCriteria(request: GenerateCriteriaRequest): Promise<string> {
    const apiKey = await this.getApiKey()

    const prompt = `Genera criterios de aceptación claros y específicos para la siguiente tarea QA:

Título: ${request.titulo}
${request.categoria ? `Categoría: ${request.categoria}` : ''}
${request.tipo ? `Tipo: ${request.tipo}` : ''}
${request.comentarios ? `Comentarios adicionales: ${request.comentarios}` : ''}

Los criterios de aceptación deben ser:
- Específicos y medibles
- Claros y concisos
- En formato de lista con viñetas
- En español

Responde SOLO con los criterios de aceptación, sin texto adicional.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente experto en QA. Genera criterios de aceptación claros y específicos. Responde SOLO con los criterios, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(`OpenAI API error: ${error.error?.message || 'Error desconocido'}`)
      }

      const data: OpenAIResponse = await response.json()
      const criteria = data.choices[0]?.message?.content?.trim()

      if (!criteria) {
        throw new Error('No se generaron criterios de aceptación')
      }

      return criteria
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando criterios:', error)
      throw new Error(`Error al generar criterios: ${error.message}`)
    }
  }

  /**
   * Estima horas y prioridad para un batch de features usando IA
   */
  async estimateFeatureDetails(features: Array<{
    title: string
    description?: string
    epicTitle?: string
    criteriosAceptacion?: string
  }>): Promise<Array<{
    estimatedHours: number
    priority: 'high' | 'medium' | 'low'
  }>> {
    const apiKey = await this.getApiKey()

    const prompt = `Analiza las siguientes funcionalidades y estima para cada una:
1. Horas estimadas de desarrollo (número decimal con 1 decimal, ej: 2.5, 8.0)
2. Prioridad ("high", "medium", o "low")

Considera:
- Complejidad técnica
- Alcance de la funcionalidad
- Dependencias
- Tamaño del equipo típico

Funcionalidades:
${JSON.stringify(features.map(f => ({
  titulo: f.title,
  descripcion: f.description || '',
  epic: f.epicTitle || '',
  criterios: f.criteriosAceptacion || '',
})), null, 2)}

Responde SOLO con un JSON válido en este formato exacto:
{
  "estimations": [
    {
      "estimatedHours": 2.5,
      "priority": "medium"
    }
  ]
}

IMPORTANTE:
- estimatedHours debe ser un número decimal con máximo 1 decimal
- priority debe ser exactamente "high", "medium" o "low"
- El orden debe coincidir con el orden de las funcionalidades proporcionadas`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en estimación de proyectos de software. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(`OpenAI API error: ${error.error?.message || 'Error desconocido'}`)
      }

      const data: OpenAIResponse = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI')
      }

      // Parsear JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Respuesta de OpenAI no contiene JSON válido')
      }

      const parsed = JSON.parse(jsonMatch[0])
      const estimations = parsed.estimations || []

      // Validar y formatear resultados
      return estimations.map((est: any) => ({
        estimatedHours: Math.max(0.5, Math.round((est.estimatedHours || 1) * 10) / 10), // Mínimo 0.5h, redondeado a 1 decimal
        priority: ['high', 'medium', 'low'].includes(est.priority) ? est.priority : 'medium',
      }))
    } catch (error: any) {
      console.error('[OpenAI Service] Error estimando features:', error)
      // Retornar valores por defecto en caso de error
      return features.map(() => ({
        estimatedHours: 2.0,
        priority: 'medium' as const,
      }))
    }
  }
}

export const openAIService = new OpenAIService()

