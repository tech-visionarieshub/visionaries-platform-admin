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

Campos QA estándar disponibles:
- id: ID único de la tarea
- categoria: "Funcionalidades Nuevas", "QA", "Bugs Generales", o "Otra"
- titulo: Título/Descripción breve de la tarea
- tipo: "Funcionalidad", "QA", o "Bug"
- criterios_aceptacion: Estado deseado o criterios de aceptación
- comentarios: Cualquier otro contenido que no mapee a los campos anteriores

Ejemplos de filas:
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Responde SOLO con un JSON válido en este formato:
{
  "mappings": [
    {
      "column": "nombre_de_columna",
      "field": "campo_qa" o null,
      "confidence": 0.0-1.0
    }
  ]
}

Si una columna no mapea claramente a ningún campo, usa null como field.`

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
      const mappings: CSVColumnMapping[] = parsed.mappings || []

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
}

export const openAIService = new OpenAIService()

