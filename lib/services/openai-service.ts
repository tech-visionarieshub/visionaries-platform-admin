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

  /**
   * Genera una descripción detallada del proyecto desde una cotización
   */
  async generateProjectDescription(data: {
    titulo: string
    tipoProyecto: string
    descripcionAlcance: string
    funcionalidades: Array<{ nombre: string; descripcion: string; prioridad?: string }>
    pantallas: Array<{ nombre: string; descripcion: string }>
    cliente: string
  }): Promise<string> {
    const apiKey = await this.getApiKey()

    const funcionalidadesText = data.funcionalidades
      .map(f => `- ${f.nombre}: ${f.descripcion}${f.prioridad ? ` (Prioridad: ${f.prioridad})` : ''}`)
      .join('\n')

    const pantallasText = data.pantallas
      .map(p => `- ${p.nombre}: ${p.descripcion}`)
      .join('\n')

    const prompt = `Eres un experto en gestión de proyectos de software. Genera una descripción profesional y detallada del proyecto basándote en la siguiente información:

Título del Proyecto: ${data.titulo}
Tipo de Proyecto: ${data.tipoProyecto}
Cliente: ${data.cliente}

Descripción del Alcance:
${data.descripcionAlcance || 'No especificada'}

Funcionalidades Principales:
${funcionalidadesText || 'No especificadas'}

Pantallas/Interfaces:
${pantallasText || 'No especificadas'}

Genera una descripción profesional de 3-5 párrafos que:
1. Presente el proyecto de manera clara y profesional
2. Explique el propósito y objetivos del proyecto
3. Mencione las funcionalidades principales
4. Describa el alcance general
5. Sea adecuada para documentación de proyecto

Responde SOLO con la descripción, sin títulos ni encabezados adicionales.`

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
              content: 'Eres un experto en redacción de documentación de proyectos de software. Genera descripciones profesionales y claras.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
      }

      const result: OpenAIResponse = await response.json()
      const description = result.choices[0]?.message?.content?.trim() || data.descripcionAlcance || 'Proyecto de desarrollo de software.'

      return description
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando descripción del proyecto:', error)
      return data.descripcionAlcance || `${data.titulo} es un proyecto de tipo ${data.tipoProyecto} para ${data.cliente}.`
    }
  }

  /**
   * Genera features desde las funcionalidades de una cotización
   */
  async generateFeaturesFromCotizacion(data: {
    projectName: string
    funcionalidades: Array<{ nombre: string; descripcion: string; prioridad?: "Alta" | "Media" | "Baja" }>
    pantallas: Array<{ nombre: string; descripcion: string }>
    horasTotales: number
  }): Promise<Array<{
    epicTitle: string
    title: string
    description: string
    criteriosAceptacion?: string
    tipo: 'Funcionalidad' | 'QA' | 'Bug'
    categoria: 'Funcionalidad' | 'QA' | 'Bugs Generales' | 'Otra'
    status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'completed'
    priority: 'high' | 'medium' | 'low'
    estimatedHours: number
    storyPoints?: number
  }>> {
    const apiKey = await this.getApiKey()

    const funcionalidadesText = data.funcionalidades
      .map((f, i) => `${i + 1}. ${f.nombre}: ${f.descripcion} (Prioridad: ${f.prioridad || 'Media'})`)
      .join('\n')

    const horasPorFeature = Math.ceil(data.horasTotales / Math.max(data.funcionalidades.length, 1))

    const prompt = `Eres un experto en gestión de proyectos de software. Convierte las siguientes funcionalidades de una cotización en features técnicas detalladas para un proyecto.

Proyecto: ${data.projectName}
Total de horas estimadas: ${data.horasTotales}h
Horas promedio por feature: ~${horasPorFeature}h

Funcionalidades:
${funcionalidadesText}

Pantallas/Interfaces:
${data.pantallas.map(p => `- ${p.nombre}: ${p.descripcion}`).join('\n') || 'No especificadas'}

Para cada funcionalidad, genera una feature con:
1. Epic Title: Agrupa funcionalidades relacionadas en epics (máximo 3-4 epics)
2. Title: Nombre claro y técnico de la feature
3. Description: Descripción detallada de lo que debe hacer la feature
4. Criterios de Aceptación: Lista de criterios claros y medibles (3-5 puntos)
5. Tipo: "Funcionalidad" (siempre para estas)
6. Categoria: "Funcionalidad" (siempre para estas)
7. Status: "backlog" (todas empiezan aquí)
8. Priority: "high" si la prioridad original es "Alta", "medium" si es "Media", "low" si es "Baja"
9. Estimated Hours: Distribuye las horas totales de forma proporcional según la complejidad
10. Story Points: Estima story points (1-13) basado en la complejidad

IMPORTANTE:
- Distribuye las ${data.horasTotales}h entre todas las features de forma proporcional
- Las features más complejas deben tener más horas
- Responde SOLO con un JSON válido en este formato exacto:
{
  "features": [
    {
      "epicTitle": "Nombre del Epic",
      "title": "Nombre de la Feature",
      "description": "Descripción detallada",
      "criteriosAceptacion": "1. Criterio 1\n2. Criterio 2\n3. Criterio 3",
      "tipo": "Funcionalidad",
      "categoria": "Funcionalidad",
      "status": "backlog",
      "priority": "high|medium|low",
      "estimatedHours": 8,
      "storyPoints": 5
    }
  ]
}`

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
              content: 'Eres un experto en gestión de proyectos de software. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
      }

      const responseData: OpenAIResponse = await response.json()
      const content = responseData.choices[0]?.message?.content?.trim() || ''

      // Parsear JSON de la respuesta
      let parsed: { features: any[] }
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No se encontró JSON en la respuesta')
        }
      } catch (parseError) {
        console.error('[OpenAI Service] Error parseando JSON de features:', parseError)
        // Si falla el parsing, crear features básicas desde las funcionalidades
        return data.funcionalidades.map((func, index) => {
          const horas = Math.ceil(data.horasTotales / data.funcionalidades.length)
          return {
            epicTitle: 'Funcionalidades Principales',
            title: func.nombre,
            description: func.descripcion,
            criteriosAceptacion: `1. La funcionalidad debe cumplir con: ${func.descripcion}\n2. Debe estar completamente implementada y probada\n3. Debe cumplir con los estándares de calidad del proyecto`,
            tipo: 'Funcionalidad' as const,
            categoria: 'Funcionalidad' as const,
            status: 'backlog' as const,
            priority: (func.prioridad === 'Alta' ? 'high' : func.prioridad === 'Baja' ? 'low' : 'medium') as 'high' | 'medium' | 'low',
            estimatedHours: horas,
            storyPoints: horas <= 8 ? 3 : horas <= 16 ? 5 : 8,
          }
        })
      }

      // Validar y ajustar las features generadas
      const features = parsed.features.map((f, index) => {
        const horas = f.estimatedHours || Math.ceil(data.horasTotales / parsed.features.length)
        
        return {
          epicTitle: f.epicTitle || 'Funcionalidades Principales',
          title: f.title || `Feature ${index + 1}`,
          description: f.description || '',
          criteriosAceptacion: f.criteriosAceptacion || `1. Implementar ${f.title}\n2. Probar funcionalidad\n3. Documentar`,
          tipo: (f.tipo === 'Funcionalidad' || f.tipo === 'QA' || f.tipo === 'Bug') ? f.tipo : 'Funcionalidad' as const,
          categoria: (f.categoria === 'Funcionalidad' || f.categoria === 'QA' || f.categoria === 'Bugs Generales' || f.categoria === 'Otra') ? f.categoria : 'Funcionalidad' as const,
          status: 'backlog' as const,
          priority: (f.priority === 'high' || f.priority === 'medium' || f.priority === 'low') ? f.priority : 'medium' as const,
          estimatedHours: horas,
          storyPoints: f.storyPoints || (horas <= 8 ? 3 : horas <= 16 ? 5 : 8),
        }
      })

      return features
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando features:', error)
      // Si falla, crear features básicas desde las funcionalidades
      return data.funcionalidades.map((func, index) => {
        const horas = Math.ceil(data.horasTotales / data.funcionalidades.length)
        return {
          epicTitle: 'Funcionalidades Principales',
          title: func.nombre,
          description: func.descripcion,
          criteriosAceptacion: `1. La funcionalidad debe cumplir con: ${func.descripcion}\n2. Debe estar completamente implementada y probada\n3. Debe cumplir con los estándares de calidad del proyecto`,
          tipo: 'Funcionalidad' as const,
          categoria: 'Funcionalidad' as const,
          status: 'backlog' as const,
          priority: (func.prioridad === 'Alta' ? 'high' : func.prioridad === 'Baja' ? 'low' : 'medium') as 'high' | 'medium' | 'low',
          estimatedHours: horas,
          storyPoints: horas <= 8 ? 3 : horas <= 16 ? 5 : 8,
        }
      })
    }
  }

  /**
   * Extrae información de una cotización desde el contenido de un documento
   */
  async extractCotizacionFromDocument(documentContent: string): Promise<{
    titulo: string
    cliente: string
    clienteId?: string
    tipoProyecto: string
    descripcion: string
    funcionalidades: Array<{ nombre: string; descripcion: string; prioridad?: "Alta" | "Media" | "Baja" }>
    pantallas: Array<{ nombre: string; descripcion: string }>
    presupuesto: number
    horasTotales: number
    meses: number
  }> {
    const apiKey = await this.getApiKey()

    const prompt = `Eres un experto en análisis de documentos de cotización de proyectos de software. Extrae la siguiente información del documento proporcionado:

INFORMACIÓN A EXTRAER:
1. Título del Proyecto
2. Nombre del Cliente
3. Tipo de Proyecto (Dashboard, CRM, E-commerce, App Móvil, Website, Personalizado)
4. Descripción del alcance/proyecto
5. Lista de funcionalidades con sus descripciones y prioridades (si están mencionadas)
6. Lista de pantallas/interfaces (si están mencionadas)
7. Presupuesto total (en cualquier moneda, convertir a número)
8. Horas totales estimadas
9. Duración en meses

DOCUMENTO:
${documentContent.substring(0, 15000)} ${documentContent.length > 15000 ? '...[documento truncado]' : ''}

Responde SOLO con un JSON válido en este formato exacto:
{
  "titulo": "Nombre del proyecto",
  "cliente": "Nombre del cliente",
  "tipoProyecto": "Dashboard|CRM|E-commerce|App Móvil|Website|Personalizado",
  "descripcion": "Descripción completa del alcance",
  "funcionalidades": [
    {
      "nombre": "Nombre de la funcionalidad",
      "descripcion": "Descripción detallada",
      "prioridad": "Alta|Media|Baja" (opcional, usar "Media" si no se especifica)
    }
  ],
  "pantallas": [
    {
      "nombre": "Nombre de la pantalla",
      "descripcion": "Descripción"
    }
  ],
  "presupuesto": 0 (número, 0 si no se encuentra),
  "horasTotales": 0 (número, 0 si no se encuentra),
  "meses": 6 (número, 6 por defecto si no se encuentra)
}

IMPORTANTE:
- Si no encuentras alguna información, usa valores por defecto razonables
- Extrae TODAS las funcionalidades mencionadas en el documento
- Si hay secciones como "Alcance", "Funcionalidades", "Requisitos", extrae la información de ahí
- Para el presupuesto, busca números grandes que puedan ser costos (ignora números pequeños como IDs)
- Para horas, busca números seguidos de "h", "horas", "hours"`

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
              content: 'Eres un experto en análisis de documentos de cotización. Extrae información estructurada de manera precisa. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
      }

      const responseData: OpenAIResponse = await response.json()
      const content = responseData.choices[0]?.message?.content?.trim() || ''

      // Parsear JSON de la respuesta
      let parsed: any
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No se encontró JSON en la respuesta')
        }
      } catch (parseError) {
        console.error('[OpenAI Service] Error parseando JSON de documento:', parseError)
        // Valores por defecto si falla el parsing
        return {
          titulo: 'Proyecto Generado',
          cliente: 'Cliente',
          tipoProyecto: 'Personalizado',
          descripcion: documentContent.substring(0, 500),
          funcionalidades: [],
          pantallas: [],
          presupuesto: 0,
          horasTotales: 0,
          meses: 6,
        }
      }

      // Validar y normalizar los datos extraídos
      return {
        titulo: parsed.titulo || 'Proyecto Generado',
        cliente: parsed.cliente || 'Cliente',
        clienteId: parsed.clienteId,
        tipoProyecto: parsed.tipoProyecto || 'Personalizado',
        descripcion: parsed.descripcion || documentContent.substring(0, 500),
        funcionalidades: Array.isArray(parsed.funcionalidades) 
          ? parsed.funcionalidades.map((f: any) => ({
              nombre: f.nombre || 'Funcionalidad',
              descripcion: f.descripcion || '',
              prioridad: (f.prioridad === 'Alta' || f.prioridad === 'Media' || f.prioridad === 'Baja') 
                ? f.prioridad 
                : 'Media' as "Alta" | "Media" | "Baja",
            }))
          : [],
        pantallas: Array.isArray(parsed.pantallas)
          ? parsed.pantallas.map((p: any) => ({
              nombre: p.nombre || 'Pantalla',
              descripcion: p.descripcion || '',
            }))
          : [],
        presupuesto: typeof parsed.presupuesto === 'number' ? parsed.presupuesto : 0,
        horasTotales: typeof parsed.horasTotales === 'number' ? parsed.horasTotales : 0,
        meses: typeof parsed.meses === 'number' ? parsed.meses : 6,
      }
    } catch (error: any) {
      console.error('[OpenAI Service] Error extrayendo información del documento:', error)
      // Valores por defecto si falla
      return {
        titulo: 'Proyecto Generado',
        cliente: 'Cliente',
        tipoProyecto: 'Personalizado',
        descripcion: documentContent.substring(0, 500),
        funcionalidades: [],
        pantallas: [],
        presupuesto: 0,
        horasTotales: 0,
        meses: 6,
      }
    }
  }

  /**
   * Genera un reporte de status semanal usando IA
   */
  async generateStatusReport(data: {
    completedFeatures: Array<{
      id: string
      title: string
      description?: string
      epicTitle?: string
      tipo?: string
      categoria?: string
      completedAt?: Date
    }>
    commits: Array<{
      message: string
      author: string
      date: string
      additions?: number
      deletions?: number
    }>
    inProgressFeatures: Array<{
      id: string
      title: string
      description?: string
      epicTitle?: string
      tipo?: string
      categoria?: string
      status: string
    }>
    blockers: Array<{
      id: string
      title: string
      description?: string
      epicTitle?: string
      tipo?: string
      categoria?: string
      status: string
      assignee?: string
      comentarios?: string
    }>
    progressPercentage: number
    projectName: string
    weekStartDate: Date
    weekEndDate: Date
    language?: 'es' | 'en'
    weekNumber?: number
  }): Promise<string> {
    const apiKey = await this.getApiKey()

    const targetLanguage = data.language || 'es'
    const isEnglish = targetLanguage === 'en'
    
    // Formatear fechas según el idioma
    const formatDate = (date: Date, language: 'es' | 'en' = 'es') => {
      const locale = language === 'en' ? 'en-US' : 'es-ES'
      return date.toLocaleDateString(locale, { 
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    const startDateFormatted = formatDate(data.weekStartDate, targetLanguage)
    const endDateFormatted = formatDate(data.weekEndDate, targetLanguage)

    // Usar el número de semana proporcionado o calcular uno por defecto
    const weekNumber = data.weekNumber || 1
    
    const reportTitle = isEnglish
      ? `Weekly Report - ${data.projectName} - Week ${weekNumber}`
      : `Reporte Semanal - ${data.projectName} - Semana ${weekNumber}`

    // Construir información de tareas completadas
    let completedTasksInfo = ''
    if (data.completedFeatures.length > 0) {
      completedTasksInfo = data.completedFeatures
        .slice(0, 10)
        .map((f) => {
          const tipo = f.tipo || f.categoria || 'Funcionalidad'
          const tipoTranslated = isEnglish 
            ? (tipo === 'Funcionalidad' ? 'Feature' : tipo === 'QA' ? 'QA' : tipo)
            : tipo
          return `ID: ${f.id}, Type: ${tipoTranslated}, Title: ${f.title}${f.description ? `, Description: ${f.description}` : ''}`
        })
        .join('\n')
    } else {
      completedTasksInfo = isEnglish 
        ? 'No tasks were completed during this period.'
        : 'No se completaron tareas durante este período.'
    }

    // Construir información de commits
    let commitsInfo = ''
    if (data.commits.length > 0) {
      const topCommits = data.commits.slice(0, 15)
      commitsInfo = topCommits
        .map((c) => {
          let commitText = isEnglish
            ? `Message: ${c.message}, Author: ${c.author}`
            : `Mensaje: ${c.message}, Autor: ${c.author}`
          if (c.additions || c.deletions) {
            commitText += isEnglish
              ? `, Changes: +${c.additions || 0} lines / -${c.deletions || 0} lines`
              : `, Cambios: +${c.additions || 0} líneas / -${c.deletions || 0} líneas`
          }
          return commitText
        })
        .join('\n')
    } else {
      commitsInfo = isEnglish
        ? 'No commits registered for this period.'
        : 'No hay commits registrados para este período.'
    }

    // Construir información de tareas planificadas
    let plannedTasksInfo = ''
    if (data.inProgressFeatures.length > 0) {
      plannedTasksInfo = data.inProgressFeatures
        .slice(0, 10)
        .map((f) => {
          const tipo = f.tipo || f.categoria || 'Funcionalidad'
          const tipoTranslated = isEnglish 
            ? (tipo === 'Funcionalidad' ? 'Feature' : tipo === 'QA' ? 'QA' : tipo)
            : tipo
          return `ID: ${f.id}, Type: ${tipoTranslated}, Title: ${f.title}${f.description ? `, Description: ${f.description}` : ''}`
        })
        .join('\n')
    } else {
      plannedTasksInfo = isEnglish
        ? 'No tasks planned for next week.'
        : 'No hay tareas planificadas para la próxima semana.'
    }

    // Construir información de blockers
    let blockersInfo = ''
    if (data.blockers.length > 0) {
      blockersInfo = data.blockers
        .slice(0, 10)
        .map((b) => {
          const tipo = b.tipo || b.categoria || 'Funcionalidad'
          const tipoTranslated = isEnglish 
            ? (tipo === 'Funcionalidad' ? 'Feature' : tipo === 'QA' ? 'QA' : tipo)
            : tipo
          let blockerText = isEnglish
            ? `ID: ${b.id}, Type: ${tipoTranslated}, Title: ${b.title}`
            : `ID: ${b.id}, Tipo: ${tipo}, Título: ${b.title}`
          if (b.description) {
            blockerText += isEnglish ? `, Description: ${b.description}` : `, Descripción: ${b.description}`
          }
          if (b.comentarios) {
            blockerText += isEnglish ? `, Comments: ${b.comentarios}` : `, Comentarios: ${b.comentarios}`
          }
          if (!b.assignee) {
            blockerText += isEnglish ? ', Status: Unassigned' : ', Estado: Sin asignar'
          }
          return blockerText
        })
        .join('\n')
    } else {
      blockersInfo = isEnglish
        ? 'There are no blockers or situations that may affect the project progress at this time.'
        : 'No existen blockers o situaciones que puedan afectar el progreso del proyecto en este momento.'
    }

    const languageInstructions = isEnglish 
      ? 'Generate the report in English. Use professional and clear English language. IMPORTANT: Translate ALL content to English, including task titles, descriptions, and any Spanish text provided in the data. All dates are already formatted in English format.'
      : 'Genera el reporte en español. Usa lenguaje profesional y claro en español.'
    
    const sectionTitles = isEnglish
      ? {
          title: reportTitle,
          subtitle: 'Report period',
          completed: 'What was done this week',
          progress: 'Project Progress',
          nextWeek: 'What will be done next week',
          blockers: 'Blockers and Pending Items'
        }
      : {
          title: reportTitle,
          subtitle: 'Periodo del reporte',
          completed: 'Lo que se hizo esta semana',
          progress: 'Progreso del Proyecto',
          nextWeek: 'Lo que se hará la próxima semana',
          blockers: 'Blockers y Pendientes'
        }

    const prompt = `Generate a progress report for the project ${data.projectName} with the following structure using bullets (dashes or dots) in plain text. The report must clearly include the period it covers, indicating the start and end dates of the report under the main title.

${languageInstructions}

Required structure:

Title: ${sectionTitles.title}

Subtitle: ${sectionTitles.subtitle}: ${startDateFormatted} to ${endDateFormatted}

Section: ${sectionTitles.completed}

This section MUST include TWO mandatory parts using bullets:

1. Completed tasks: List each completed task using bullets. For each task include: a brief description, the ID and type (Feature or QA). Format: "- [Brief description] (ID: [id], Type: [type])"

2. Commits and technical improvements: IF THERE ARE COMMITS LISTED BELOW, YOU MUST include a summary of relevant commits using bullets. List the most important commits or group similar ones. Format: "- [Description of commit or technical improvement]". If there are no commits, omit this part.

CRITICAL IMPORTANT: 
- If commit information is provided, you MUST include it in the report without exception using bullets
- Do not omit commits if they are listed
- Use bullets for each commit or group of similar commits
- Mention the most relevant commits

Completed tasks information:
${completedTasksInfo}

${data.commits.length > 0 ? `Commits information (MANDATORY to include in the report using bullets):
${commitsInfo}

Total commits in the period: ${data.commits.length}` : isEnglish ? 'No commits registered for this period.' : 'No hay commits registrados para este período.'}

Section: ${sectionTitles.progress}

Indicate the general progress percentage of the project based on the provided information.

Progress percentage: ${data.progressPercentage}%

Section: ${sectionTitles.nextWeek}

List the planned tasks using bullets.

For each one, include its description and additional information (id and type) using the format: "- [Brief description] (ID: [id], Type: [type])"

${isEnglish ? 'CRITICAL: Translate all task titles and descriptions to English. Do not leave any Spanish text in the report. All content must be in English.' : ''}

Planned tasks information:
${plannedTasksInfo}

Section: ${sectionTitles.blockers}

Indicate if there are any blockages or situations that may affect progress using bullets.

If there are no blockers, mention it explicitly in a bullet.

Blockers information:
${blockersInfo}

Additional instructions:

Write in a formal, clear and professional tone.

USE BULLETS (simple dashes -) for all lists. Format: "- [text]" or "• [text]"

Do not use Markdown format (no asterisks *, no header symbols #).

Use only plain text with bullets (dashes or dots) and line breaks.

Respect the order of sections.

The report must use bullets for all lists. Format example:
- Task 1 (ID: XXX, Type: Feature)
- Task 2 (ID: YYY, Type: QA)
- Commit: Improvement in the authentication system`

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
              content: isEnglish
                ? 'You are an expert assistant in client communication. Generate professional, clear and structured progress reports. Respond ONLY with the complete report in PLAIN TEXT with bullets (use dashes - for lists). Use only line breaks and paragraphs. No additional text before or after the report.'
                : 'Eres un asistente experto en comunicación con clientes. Genera reportes de progreso profesionales, claros y estructurados. Responde SOLO con el reporte completo en TEXTO PLANO con bullets (usa guiones - para listas). Usa solo saltos de línea y párrafos. Sin texto adicional antes o después del reporte.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(`OpenAI API error: ${error.error?.message || 'Error desconocido'}`)
      }

      const result: OpenAIResponse = await response.json()
      const report = result.choices[0]?.message?.content?.trim()

      if (!report) {
        throw new Error('No se generó el reporte')
      }

      return report
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando status report:', error)
      throw new Error(`Error al generar reporte de status: ${error.message}`)
    }
  }
}

export const openAIService = new OpenAIService()

