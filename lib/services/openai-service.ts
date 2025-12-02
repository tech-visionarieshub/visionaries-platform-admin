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
  private get db() {
    return getInternalFirestore()
  }
  
  private get configCollection() {
    return this.db.collection('config')
  }

  /**
   * Obtiene la API key de OpenAI desde Firestore
   */
  private async getApiKey(): Promise<string> {
    try {
      const doc = await this.configCollection.doc('openai').get()
      
      console.log('[OpenAI Service] Verificando documento openai:', {
        exists: doc.exists,
        hasData: !!doc.data(),
      })
      
      if (!doc.exists) {
        console.error('[OpenAI Service] Documento openai no existe en Firestore')
        throw new Error('OpenAI API key no está configurada. Ve a Settings para configurarla.')
      }

      const data = doc.data()
      console.log('[OpenAI Service] Datos del documento:', {
        hasApiKey: !!data?.apiKey,
        apiKeyLength: data?.apiKey?.length || 0,
        keys: Object.keys(data || {}),
      })
      
      if (!data?.apiKey) {
        console.error('[OpenAI Service] Documento existe pero no tiene apiKey')
        throw new Error('OpenAI API key no está configurada. Ve a Settings para configurarla.')
      }

      return data.apiKey
    } catch (error: any) {
      console.error('[OpenAI Service] Error obteniendo API key:', {
        message: error.message,
        stack: error.stack,
      })
      throw error
    }
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

  /**
   * Limpia y repara JSON con caracteres de control problemáticos
   */
  private cleanJsonString(jsonString: string): string {
    try {
      // Primero intentar parsear directamente
      JSON.parse(jsonString)
      return jsonString
    } catch {
      // Si falla, limpiar caracteres de control problemáticos
      let cleaned = jsonString
      
      // Método 1: Escapar caracteres de control dentro de strings JSON
      // Usar una expresión regular más robusta para encontrar strings
      cleaned = cleaned.replace(/"([^"\\]|\\.)*"/g, (match) => {
        // Dentro de un string JSON, escapar caracteres de control
        return match
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
          .replace(/[\x00-\x1F\x7F]/g, (char) => {
            const code = char.charCodeAt(0)
            return `\\u${code.toString(16).padStart(4, '0')}`
          })
      })
      
      // Método 2: Si aún falla, limpieza más agresiva
      try {
        JSON.parse(cleaned)
        return cleaned
      } catch {
        // Limpieza agresiva: eliminar caracteres de control fuera de strings
        cleaned = jsonString
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Eliminar caracteres de control excepto \n, \r, \t
          .replace(/\n(?![^"]*"[^"]*:)/g, ' ') // Reemplazar \n fuera de strings con espacio
          .replace(/\r(?![^"]*"[^"]*:)/g, ' ') // Reemplazar \r fuera de strings con espacio
          .replace(/\t(?![^"]*"[^"]*:)/g, ' ') // Reemplazar \t fuera de strings con espacio
          .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      }
      
      return cleaned
    }
  }

  /**
   * Genera funcionalidades desde un transcript de reunión usando IA
   */
  async generateFeaturesFromTranscript(transcript: string): Promise<Array<{
    epicTitle: string
    title: string
    description: string
    criteriosAceptacion?: string
    comentarios?: string
    tipo: 'Funcionalidad' | 'QA' | 'Bug'
    categoria: 'Funcionalidad' | 'QA' | 'Bugs Generales' | 'Otra'
    status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'completed'
    priority: 'high' | 'medium' | 'low'
    estimatedHours: number
    storyPoints?: number
  }>> {
    const apiKey = await this.getApiKey()

    // Truncar transcript a 80,000 caracteres para respetar límites de tokens
    const transcriptToProcess = transcript.length > 80000 
      ? transcript.substring(0, 80000) + '... [transcript truncado]'
      : transcript

    const prompt = `Eres un experto en análisis de reuniones con clientes y gestión de proyectos de software. Analiza el siguiente transcript de una reunión y extrae todas las funcionalidades, requisitos y características mencionadas.

TRANSCRIPT:
${transcriptToProcess}

Para cada funcionalidad, requisito o característica mencionada en el transcript, genera una feature con la siguiente estructura:

1. Epic Title: Agrupa funcionalidades relacionadas en epics lógicos (máximo 4-5 epics). Usa nombres descriptivos como "Sistema de Autenticación", "Dashboard de Analytics", "Gestión de Usuarios", etc.

2. Title: Nombre claro y técnico de la funcionalidad basado en lo mencionado en el transcript

3. Description: Descripción detallada de lo que debe hacer la funcionalidad, incluyendo contexto de la conversación cuando sea relevante

4. Criterios de Aceptación: Lista de criterios claros y medibles (3-5 puntos) basados en los requisitos mencionados

5. Tipo: "Funcionalidad" (la mayoría), "QA" solo si se menciona explícitamente testing, o "Bug" solo si se menciona un error específico

6. Categoria: "Funcionalidad" (la mayoría), "QA" solo si es explícitamente de testing, "Bugs Generales" solo si es un bug, "Otra" solo si no encaja en las anteriores

7. Status: "backlog" (todas empiezan aquí)

8. Priority: 
   - "high" si se menciona como urgente, crítica, importante, prioritaria
   - "low" si se menciona como opcional, nice-to-have, futuro
   - "medium" para todo lo demás

9. Estimated Hours: Estima horas de desarrollo basándote en la complejidad mencionada (mínimo 1h, máximo 40h, usar decimales como 2.5, 8.0)

10. Story Points: Estima story points (1-13) basado en la complejidad

IMPORTANTE:
- Extrae TODAS las funcionalidades mencionadas, no solo las principales
- Si se menciona algo como "necesitamos que...", "debería tener...", "sería bueno que...", "requerimos...", conviértelo en una feature
- Agrupa funcionalidades relacionadas en el mismo epic
- Si no hay suficiente información para estimar horas, usa valores conservadores (2-4 horas)
- Responde SOLO con un JSON válido en este formato exacto:
{
  "features": [
    {
      "epicTitle": "Nombre del Epic",
      "title": "Nombre de la Feature",
      "description": "Descripción detallada",
      "criteriosAceptacion": "1. Criterio 1\n2. Criterio 2\n3. Criterio 3",
      "comentarios": "Notas adicionales si las hay",
      "tipo": "Funcionalidad",
      "categoria": "Funcionalidad",
      "status": "backlog",
      "priority": "high|medium|low",
      "estimatedHours": 8.0,
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
              content: 'Eres un experto en análisis de reuniones con clientes y gestión de proyectos de software. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 8000,
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

      console.log('[OpenAI Service] Respuesta recibida de OpenAI (primeros 1000 caracteres):', content.substring(0, 1000))

      // Limpiar el contenido: remover markdown code blocks si existen
      let cleanedContent = content.trim()
      
      // Remover ```json o ``` al inicio/final si existen
      cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/g, '')
      
      // Buscar JSON en el contenido
      let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      
      // Si no encuentra con el patrón simple, intentar buscar desde la primera llave
      if (!jsonMatch) {
        const firstBrace = cleanedContent.indexOf('{')
        if (firstBrace !== -1) {
          const lastBrace = cleanedContent.lastIndexOf('}')
          if (lastBrace !== -1 && lastBrace > firstBrace) {
            jsonMatch = [cleanedContent.substring(firstBrace, lastBrace + 1)]
          }
        }
      }

      if (!jsonMatch) {
        console.error('[OpenAI Service] Respuesta sin JSON válido. Contenido completo:', content)
        throw new Error('Respuesta de OpenAI no contiene JSON válido. La respuesta fue: ' + content.substring(0, 200))
      }

      let parsed
      try {
        let jsonString = jsonMatch[0]
        console.log('[OpenAI Service] Intentando parsear JSON (primeros 500 caracteres):', jsonString.substring(0, 500))
        
        // Limpiar JSON antes de parsear
        jsonString = this.cleanJsonString(jsonString)
        
        parsed = JSON.parse(jsonString)
      } catch (parseError: any) {
        console.error('[OpenAI Service] Error parseando JSON:', {
          error: parseError.message,
          jsonPreview: jsonMatch[0].substring(0, 1000),
          fullContent: content,
        })
        throw new Error(`Error al parsear la respuesta JSON de OpenAI: ${parseError.message}. Respuesta recibida: ${content.substring(0, 300)}`)
      }

      const features = parsed.features || []

      if (!Array.isArray(features) || features.length === 0) {
        console.error('[OpenAI Service] No se generaron features. Respuesta:', parsed)
        throw new Error('No se generaron funcionalidades. Intenta con un transcript más detallado.')
      }

      // Validar y formatear features
      return features.map((f: any) => ({
        epicTitle: f.epicTitle || 'Sin Epic',
        title: f.title || 'Sin título',
        description: f.description || '',
        criteriosAceptacion: f.criteriosAceptacion || '',
        comentarios: f.comentarios || '',
        tipo: ['Funcionalidad', 'QA', 'Bug'].includes(f.tipo) ? f.tipo : 'Funcionalidad',
        categoria: ['Funcionalidad', 'QA', 'Bugs Generales', 'Otra'].includes(f.categoria) ? f.categoria : 'Funcionalidad',
        status: 'backlog' as const,
        priority: ['high', 'medium', 'low'].includes(f.priority) ? f.priority : 'medium',
        estimatedHours: Math.max(1, Math.min(40, parseFloat(f.estimatedHours) || 2)),
        storyPoints: Math.max(1, Math.min(13, parseInt(f.storyPoints) || 3)),
      }))
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando features desde transcript:', error)
      throw new Error(`Error al generar funcionalidades: ${error.message}`)
    }
  }

  /**
   * Detecta funcionalidades duplicadas comparando nuevas features con existentes usando IA
   */
  async detectDuplicateFeatures(
    newFeatures: Array<{ title: string; description: string; epicTitle: string }>,
    existingFeatures: Array<{ title: string; description: string; epicTitle: string }>
  ): Promise<Array<{
    isPossibleDuplicate: boolean
    duplicateOf: string | null
    similarityScore: number
  }>> {
    const apiKey = await this.getApiKey()

    // Si no hay features existentes, retornar que ninguna es duplicado
    if (existingFeatures.length === 0) {
      return newFeatures.map(() => ({
        isPossibleDuplicate: false,
        duplicateOf: null,
        similarityScore: 0,
      }))
    }

    const prompt = `Eres un experto en análisis de funcionalidades de software. Compara las siguientes funcionalidades NUEVAS con las funcionalidades EXISTENTES y determina si alguna nueva es similar o duplicada de alguna existente.

FUNCIONALIDADES NUEVAS:
${JSON.stringify(newFeatures.map((f, i) => ({
  index: i,
  epicTitle: f.epicTitle,
  title: f.title,
  description: f.description,
})), null, 2)}

FUNCIONALIDADES EXISTENTES:
${JSON.stringify(existingFeatures.map((f, i) => ({
  index: i,
  epicTitle: f.epicTitle,
  title: f.title,
  description: f.description,
})), null, 2)}

Para cada funcionalidad NUEVA, determina:
1. Si es similar o duplicada de alguna EXISTENTE (considera el título, descripción y epic)
2. Si es similar, indica el título de la funcionalidad existente más similar
3. Un score de similitud entre 0.0 y 1.0 (donde 1.0 es idéntica)

IMPORTANTE:
- Dos funcionalidades son similares si tienen el mismo propósito o funcionalidad, aunque usen palabras diferentes
- Considera variaciones en el nombre pero mismo objetivo
- Si una nueva feature es parte de o está relacionada con una existente, también es similar
- Responde SOLO con un JSON válido en este formato exacto:
{
  "comparisons": [
    {
      "newFeatureIndex": 0,
      "isPossibleDuplicate": true,
      "duplicateOf": "Título de la feature existente más similar",
      "similarityScore": 0.85
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
              content: 'Eres un experto en análisis de funcionalidades de software. Responde SOLO con JSON válido, sin texto adicional.'
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
        console.warn('[OpenAI Service] Respuesta sin JSON válido para detección de duplicados, asumiendo que no hay duplicados')
        return newFeatures.map(() => ({
          isPossibleDuplicate: false,
          duplicateOf: null,
          similarityScore: 0,
        }))
      }

      let parsed
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.warn('[OpenAI Service] Error parseando JSON de duplicados, asumiendo que no hay duplicados')
        return newFeatures.map(() => ({
          isPossibleDuplicate: false,
          duplicateOf: null,
          similarityScore: 0,
        }))
      }

      const comparisons = parsed.comparisons || []
      
      // Crear un mapa de índices a resultados
      const resultMap = new Map<number, { isPossibleDuplicate: boolean; duplicateOf: string | null; similarityScore: number }>()
      
      comparisons.forEach((comp: any) => {
        const index = comp.newFeatureIndex
        if (typeof index === 'number' && index >= 0 && index < newFeatures.length) {
          resultMap.set(index, {
            isPossibleDuplicate: comp.isPossibleDuplicate === true,
            duplicateOf: comp.duplicateOf || null,
            similarityScore: Math.max(0, Math.min(1, parseFloat(comp.similarityScore) || 0)),
          })
        }
      })

      // Retornar resultados en el mismo orden que las nuevas features
      return newFeatures.map((_, index) => {
        const result = resultMap.get(index)
        return result || {
          isPossibleDuplicate: false,
          duplicateOf: null,
          similarityScore: 0,
        }
      })
    } catch (error: any) {
      console.error('[OpenAI Service] Error detectando duplicados:', error)
      // En caso de error, retornar que no hay duplicados para no bloquear el flujo
      return newFeatures.map(() => ({
        isPossibleDuplicate: false,
        duplicateOf: null,
        similarityScore: 0,
      }))
    }
  }

  /**
   * Genera tareas del equipo desde un transcript de reunión usando IA
   */
  async generateTeamTasksFromTranscript(transcript: string): Promise<Array<{
    title: string
    description: string
    category: 'Propuestas' | 'Startups' | 'Evolution' | 'Pathway' | 'Desarrollo' | 'QA' | 'Portal Admin' | 'Aura' | 'Redes Sociales' | 'Conferencias' | 'Inversión' | 'Pagos' | 'Otra'
    customCategory?: string
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'in-progress' | 'review' | 'completed' | 'cancelled'
    estimatedHours: number
  }>> {
    const apiKey = await this.getApiKey()

    // Truncar transcript a 80,000 caracteres para respetar límites de tokens
    const transcriptToProcess = transcript.length > 80000 
      ? transcript.substring(0, 80000) + '... [transcript truncado]'
      : transcript

    const prompt = `Eres un experto en análisis de correos, reuniones y gestión de tareas de equipo. Analiza el siguiente texto (puede ser un transcript de reunión, un correo electrónico, un resumen de propuestas, o cualquier documento con tareas pendientes) y extrae TODAS las tareas, pendientes y acciones mencionadas.

TEXTO:
${transcriptToProcess}

Para cada tarea, pendiente o acción mencionada, genera una tarea con la siguiente estructura:

1. Title: Nombre claro y conciso de la tarea. Si hay un cliente/proyecto específico, inclúyelo en el título. Ejemplos:
   - "Preparar listado de funcionalidades - CTR"
   - "Enviar documento de validación - CTR"
   - "Revisar código existente - Transportes Americanos"
   - "Capacitar equipo TI - Transportes Americanos"

2. Description: Descripción detallada de lo que debe hacerse, incluyendo:
   - Contexto del cliente/proyecto si aplica
   - Detalles específicos mencionados
   - Pasos o requisitos mencionados

3. Category: Selecciona la categoría más apropiada de esta lista:
   - "Propuestas": Tareas relacionadas con propuestas comerciales, cotizaciones, validaciones con clientes, preparación de documentos comerciales
   - "Startups": Tareas relacionadas con startups
   - "Evolution": Tareas relacionadas con Evolution
   - "Pathway": Tareas relacionadas con Pathway
   - "Desarrollo": Tareas de desarrollo técnico, programación, implementación
   - "QA": Tareas de testing y calidad
   - "Portal Admin": Tareas del portal administrativo
   - "Aura": Tareas relacionadas con Aura
   - "Redes Sociales": Tareas de redes sociales y marketing
   - "Conferencias": Tareas relacionadas con conferencias y eventos
   - "Inversión": Tareas relacionadas con inversión
   - "Pagos": Tareas relacionadas con pagos y facturación
   - "Otra": Si no encaja en ninguna categoría anterior (en este caso, incluye customCategory con una descripción)

4. Priority: 
   - "high" si se menciona como urgente, crítica, importante, prioritaria, o si es parte de proyectos prioritarios
   - "low" si se menciona como opcional, nice-to-have, futuro, o proyecto adicional opcional
   - "medium" para todo lo demás

5. Status: "pending" (todas empiezan aquí)

6. Estimated Hours: Estima horas de trabajo basándote en la complejidad mencionada:
   - Tareas simples (enviar correo, revisar documento): 0.5-1h
   - Tareas de preparación/revisión: 1-3h
   - Tareas de desarrollo/implementación: 4-16h
   - Proyectos completos: 20-40h
   - Usa decimales como 1.5, 4.0, 8.5

IMPORTANTE:
- Extrae TODAS las tareas mencionadas, no solo las principales
- Si hay múltiples proyectos/clientes, crea tareas separadas para cada uno
- Identifica acciones como: "preparar", "enviar", "revisar", "validar", "confirmar", "seguimiento", "capacitar", "desplegar", "configurar", "diseñar", "revisar código", etc.
- Si se menciona "pendiente", "falta", "necesita", "debe", "hay que", conviértelo en una tarea
- Si hay enlaces a documentos/transcripts, menciona en la descripción que hay un documento relacionado
- Si hay múltiples tareas relacionadas con un mismo proyecto, créalas como tareas separadas
- Si no hay suficiente información para estimar horas, usa valores conservadores (1-2 horas)
- Responde SOLO con un JSON válido en este formato exacto:
{
  "tasks": [
    {
      "title": "Nombre de la Tarea",
      "description": "Descripción detallada",
      "category": "Desarrollo",
      "customCategory": "Solo si category es 'Otra'",
      "priority": "high|medium|low",
      "status": "pending",
      "estimatedHours": 2.0
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
              content: 'Eres un experto en análisis de correos, reuniones, resúmenes y gestión de tareas de equipo. Identifica todas las tareas, pendientes y acciones mencionadas, incluso si están en diferentes proyectos o clientes. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 8000,
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

      console.log('[OpenAI Service] Respuesta recibida de OpenAI para team tasks (primeros 1000 caracteres):', content.substring(0, 1000))

      // Limpiar el contenido: remover markdown code blocks si existen
      let cleanedContent = content.trim()
      
      // Remover ```json o ``` al inicio/final si existen
      cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/g, '')
      
      // Buscar JSON en el contenido
      let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      
      // Si no encuentra con el patrón simple, intentar buscar desde la primera llave
      if (!jsonMatch) {
        const firstBrace = cleanedContent.indexOf('{')
        if (firstBrace !== -1) {
          const lastBrace = cleanedContent.lastIndexOf('}')
          if (lastBrace !== -1 && lastBrace > firstBrace) {
            jsonMatch = [cleanedContent.substring(firstBrace, lastBrace + 1)]
          }
        }
      }

      if (!jsonMatch) {
        console.error('[OpenAI Service] Respuesta sin JSON válido. Contenido completo:', content)
        throw new Error('Respuesta de OpenAI no contiene JSON válido. La respuesta fue: ' + content.substring(0, 200))
      }

      let parsed
      try {
        const jsonString = jsonMatch[0]
        console.log('[OpenAI Service] Intentando parsear JSON (primeros 500 caracteres):', jsonString.substring(0, 500))
        parsed = JSON.parse(jsonString)
      } catch (parseError: any) {
        console.error('[OpenAI Service] Error parseando JSON:', {
          error: parseError.message,
          jsonPreview: jsonMatch[0].substring(0, 1000),
          fullContent: content,
        })
        throw new Error(`Error al parsear la respuesta JSON de OpenAI: ${parseError.message}. Respuesta recibida: ${content.substring(0, 300)}`)
      }

      const tasks = parsed.tasks || []

      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.error('[OpenAI Service] No se generaron tareas. Respuesta:', parsed)
        throw new Error('No se generaron tareas. Intenta con un transcript más detallado.')
      }

      // Validar y formatear tareas
      const validCategories = ['Propuestas', 'Startups', 'Evolution', 'Pathway', 'Desarrollo', 'QA', 'Portal Admin', 'Aura', 'Redes Sociales', 'Conferencias', 'Inversión', 'Pagos', 'Otra']
      
      return tasks.map((t: any) => ({
        title: t.title || 'Sin título',
        description: t.description || '',
        category: validCategories.includes(t.category) ? t.category : 'Otra',
        customCategory: t.category === 'Otra' ? (t.customCategory || t.title) : undefined,
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        status: 'pending' as const,
        estimatedHours: Math.max(0.5, Math.min(40, parseFloat(t.estimatedHours) || 1)),
      }))
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando tareas del equipo desde transcript:', error)
      throw new Error(`Error al generar tareas: ${error.message}`)
    }
  }

  /**
   * Genera tareas del equipo desde un JSON de Trello usando IA
   * Solo procesa tarjetas que NO estén completadas (closed: false y dueComplete: false)
   */
  async generateTeamTasksFromTrelloJSON(trelloData: any): Promise<Array<{
    title: string
    description: string
    category: 'Propuestas' | 'Startups' | 'Evolution' | 'Pathway' | 'Desarrollo' | 'QA' | 'Portal Admin' | 'Aura' | 'Redes Sociales' | 'Conferencias' | 'Inversión' | 'Pagos' | 'Otra'
    customCategory?: string
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'in-progress' | 'review' | 'completed' | 'cancelled'
    estimatedHours: number
    dueDate?: Date
    assignee?: string
  }>> {
    const apiKey = await this.getApiKey()

    // Extraer tarjetas del JSON de Trello
    const cards = trelloData.cards || []
    
    // Filtrar solo tarjetas no completadas
    const pendingCards = cards.filter((card: any) => {
      // Excluir tarjetas cerradas o completadas
      if (card.closed === true) return false
      if (card.dueComplete === true) return false
      return true
    })

    if (pendingCards.length === 0) {
      return []
    }

    // Crear un resumen de las tarjetas para enviar a la IA
    const cardsSummary = pendingCards.map((card: any) => ({
      id: card.id,
      name: card.name,
      desc: card.desc || '',
      due: card.due,
      start: card.start,
      idList: card.idList,
      idMembers: card.idMembers || [],
      labels: (card.labels || []).map((l: any) => l.name || l.color || ''),
      dateLastActivity: card.dateLastActivity,
    }))

    // Obtener información de listas para mapear estados
    const lists = trelloData.lists || []
    const listsMap = new Map(lists.map((list: any) => [list.id, list.name]))

    // Obtener información de miembros para mapear asignados
    const members = trelloData.members || []
    const membersMap = new Map(members.map((member: any) => [member.id, member.email || member.username]))

    // Crear contexto para la IA
    const context = {
      boardName: trelloData.name || 'Board de Trello',
      lists: lists.map((list: any) => ({ id: list.id, name: list.name })),
      cards: cardsSummary,
    }

    const contextString = JSON.stringify(context, null, 2)
    const contextToProcess = contextString.length > 50000 
      ? contextString.substring(0, 50000) + '... [contexto truncado]'
      : contextString

    const prompt = `Eres un experto en análisis de datos de Trello y gestión de tareas de equipo. Analiza el siguiente JSON exportado de Trello y transforma las tarjetas PENDIENTES (no cerradas ni completadas) en tareas estructuradas.

DATOS DE TRELLO:
${contextToProcess}

INSTRUCCIONES:
1. Solo procesa tarjetas que NO estén completadas (closed: false y dueComplete: false)
2. Para cada tarjeta pendiente, genera una tarea con la siguiente estructura:

1. Title: Usa el nombre de la tarjeta (card.name). Si es muy genérico, mejóralo basándote en la descripción.

2. Description: Combina la descripción de la tarjeta (card.desc) con información relevante. Si hay información en los labels o en el contexto del board, inclúyela.

3. Category: Selecciona la categoría más apropiada de esta lista:
   - "Propuestas": Tareas relacionadas con propuestas comerciales, cotizaciones, validaciones con clientes
   - "Startups": Tareas relacionadas con startups
   - "Evolution": Tareas relacionadas con Evolution
   - "Pathway": Tareas relacionadas con Pathway
   - "Desarrollo": Tareas de desarrollo técnico, programación, implementación
   - "QA": Tareas de testing y calidad
   - "Portal Admin": Tareas del portal administrativo
   - "Aura": Tareas relacionadas con Aura
   - "Redes Sociales": Tareas de redes sociales y marketing
   - "Conferencias": Tareas relacionadas con conferencias y eventos
   - "Inversión": Tareas relacionadas con inversión
   - "Pagos": Tareas relacionadas con pagos y facturación
   - "Otra": Si no encaja en ninguna categoría anterior (en este caso, incluye customCategory)

4. Priority: 
   - "high" si la tarjeta tiene labels como "urgente", "alta", "high", "urgent", o si la fecha de vencimiento está cerca
   - "low" si tiene labels como "baja", "low", "opcional"
   - "medium" para todo lo demás

5. Status: Mapea el estado basándote en la lista (list) donde está la tarjeta:
   - Listas como "To Do", "Pendiente", "Backlog" → "pending"
   - Listas como "Doing", "En Progreso", "In Progress" → "in-progress"
   - Listas como "Review", "Revisión" → "review"
   - Listas como "Done", "Completada" → "completed" (pero estas NO deberían estar en el JSON si están completadas)
   - Por defecto: "pending"

6. Estimated Hours: Estima horas basándote en:
   - Tareas simples (enviar correo, revisar): 0.5-1h
   - Tareas de preparación/revisión: 1-3h
   - Tareas de desarrollo/implementación: 4-16h
   - Proyectos completos: 20-40h
   - Si no hay información suficiente, usa 2h por defecto

7. Due Date: Si la tarjeta tiene fecha de vencimiento (card.due), úsala. Formato: ISO 8601 string.

8. Assignee: Si la tarjeta tiene miembros asignados (card.idMembers), intenta mapear el email del primer miembro. Si no hay email disponible, déjalo vacío.

IMPORTANTE:
- Solo procesa tarjetas PENDIENTES (closed: false y dueComplete: false)
- Si una tarjeta no tiene nombre o está vacía, omítela
- Responde SOLO con un JSON válido en este formato exacto:
{
  "tasks": [
    {
      "title": "Nombre de la Tarea",
      "description": "Descripción detallada",
      "category": "Desarrollo",
      "customCategory": "Solo si category es 'Otra'",
      "priority": "high|medium|low",
      "status": "pending|in-progress|review",
      "estimatedHours": 2.0,
      "dueDate": "2024-01-15T00:00:00.000Z" (opcional, solo si existe),
      "assignee": "email@example.com" (opcional, solo si existe)
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
              content: 'Eres un experto en análisis de datos de Trello y gestión de tareas. Transforma tarjetas de Trello en tareas estructuradas, excluyendo las completadas. Responde SOLO con JSON válido, sin texto adicional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 8000,
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

      console.log('[OpenAI Service] Respuesta recibida de OpenAI para Trello JSON (primeros 1000 caracteres):', content.substring(0, 1000))

      // Limpiar el contenido: remover markdown code blocks si existen
      let cleanedContent = content.trim()
      cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/g, '')
      
      // Buscar JSON en el contenido
      let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        const firstBrace = cleanedContent.indexOf('{')
        if (firstBrace !== -1) {
          const lastBrace = cleanedContent.lastIndexOf('}')
          if (lastBrace !== -1 && lastBrace > firstBrace) {
            jsonMatch = [cleanedContent.substring(firstBrace, lastBrace + 1)]
          }
        }
      }

      if (!jsonMatch) {
        console.error('[OpenAI Service] Respuesta sin JSON válido. Contenido completo:', content)
        throw new Error('Respuesta de OpenAI no contiene JSON válido. La respuesta fue: ' + content.substring(0, 200))
      }

      let parsed
      try {
        const jsonString = jsonMatch[0]
        console.log('[OpenAI Service] Intentando parsear JSON de Trello (primeros 500 caracteres):', jsonString.substring(0, 500))
        parsed = JSON.parse(jsonString)
      } catch (parseError: any) {
        console.error('[OpenAI Service] Error parseando JSON de Trello:', {
          error: parseError.message,
          jsonPreview: jsonMatch[0].substring(0, 1000),
          fullContent: content,
        })
        throw new Error(`Error al parsear la respuesta JSON de OpenAI: ${parseError.message}. Respuesta recibida: ${content.substring(0, 300)}`)
      }

      const tasks = parsed.tasks || []

      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.error('[OpenAI Service] No se generaron tareas desde Trello. Respuesta:', parsed)
        throw new Error('No se generaron tareas desde el JSON de Trello. Verifica que haya tarjetas pendientes.')
      }

      // Validar y formatear tareas
      const validCategories = ['Propuestas', 'Startups', 'Evolution', 'Pathway', 'Desarrollo', 'QA', 'Portal Admin', 'Aura', 'Redes Sociales', 'Conferencias', 'Inversión', 'Pagos', 'Otra']
      
      return tasks.map((t: any) => ({
        title: t.title || 'Sin título',
        description: t.description || '',
        category: validCategories.includes(t.category) ? t.category : 'Otra',
        customCategory: t.category === 'Otra' ? (t.customCategory || t.title) : undefined,
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        status: ['pending', 'in-progress', 'review'].includes(t.status) ? t.status : 'pending',
        estimatedHours: Math.max(0.5, Math.min(40, parseFloat(t.estimatedHours) || 2)),
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        assignee: t.assignee || undefined,
      }))
    } catch (error: any) {
      console.error('[OpenAI Service] Error generando tareas del equipo desde Trello JSON:', error)
      throw new Error(`Error al generar tareas desde Trello: ${error.message}`)
    }
  }
}

export const openAIService = new OpenAIService()

