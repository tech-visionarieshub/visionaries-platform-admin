import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { openAIService } from '@/lib/services/openai-service'
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository'
import { z } from 'zod'

/**
 * API para generar team tasks desde un transcript de reunión
 * POST /api/team-tasks/generate-from-transcript
 * 
 * Body: { transcript: string }
 * 
 * Retorna: { success: true, tasks: Array<TaskPreview> }
 */

const transcriptSchema = z.object({
  transcript: z.string().min(100, 'El transcript debe tener al menos 100 caracteres').max(100000, 'El transcript no puede exceder 100,000 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = await verifyIdToken(token)
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true
    const hasInternalAccess = decoded.internal === true

    if (!hasInternalAccess && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta funcionalidad' },
        { status: 403 }
      )
    }

    // Validar body
    const body = await request.json().catch(() => ({}))
    const validated = transcriptSchema.parse(body)

    // Obtener tareas existentes para comparar
    console.log(`[Generate Team Tasks from Transcript] Obteniendo tareas existentes`)
    const existingTasks = await teamTasksRepository.getAll()
    console.log(`[Generate Team Tasks from Transcript] Se encontraron ${existingTasks.length} tareas existentes`)

    // Procesar transcript con IA (con timeout de 60 segundos)
    console.log(`[Generate Team Tasks from Transcript] Procesando transcript de ${validated.transcript.length} caracteres`)

    let tasks
    try {
      const generatePromise = openAIService.generateTeamTasksFromTranscript(validated.transcript)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: El procesamiento tardó más de 60 segundos')), 60000)
      })

      tasks = await Promise.race([generatePromise, timeoutPromise])
    } catch (generateError: any) {
      console.error('[Generate Team Tasks from Transcript] Error en generateTeamTasksFromTranscript:', generateError)
      throw generateError
    }

    console.log(`[Generate Team Tasks from Transcript] Se generaron ${tasks.length} tareas`)

    // Detectar duplicados comparando con tareas existentes
    let tasksWithDuplicates = tasks
    if (existingTasks.length > 0 && tasks.length > 0) {
      console.log(`[Generate Team Tasks from Transcript] Detectando duplicados...`)
      
      // Comparación simple por título (puede mejorarse con IA si es necesario)
      tasksWithDuplicates = tasks.map((task) => {
        const titleLower = task.title.toLowerCase().trim()
        const similarTask = existingTasks.find(existing => {
          const existingTitleLower = existing.title.toLowerCase().trim()
          // Verificar si el título contiene palabras similares o es muy parecido
          return existingTitleLower.includes(titleLower) || 
                 titleLower.includes(existingTitleLower) ||
                 existingTitleLower === titleLower
        })

        if (similarTask) {
          return {
            ...task,
            isPossibleDuplicate: true,
            duplicateOf: similarTask.title,
            similarityScore: 0.8, // Score aproximado
          }
        }

        return {
          ...task,
          isPossibleDuplicate: false,
          duplicateOf: null,
          similarityScore: 0,
        }
      })

      const duplicatesCount = tasksWithDuplicates.filter(t => t.isPossibleDuplicate).length
      console.log(`[Generate Team Tasks from Transcript] Se detectaron ${duplicatesCount} posibles duplicados`)
    } else {
      // Si no hay tareas existentes, agregar campos de duplicado como false
      tasksWithDuplicates = tasks.map(t => ({
        ...t,
        isPossibleDuplicate: false,
        duplicateOf: null,
        similarityScore: 0,
      }))
    }

    return NextResponse.json({
      success: true,
      tasks: tasksWithDuplicates,
      count: tasksWithDuplicates.length,
    })
  } catch (error: any) {
    console.error('[Generate Team Tasks from Transcript] Error completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    if (error.message?.includes('Timeout')) {
      return NextResponse.json(
        { error: 'El procesamiento tardó demasiado. Intenta con un transcript más corto o verifica tu conexión.' },
        { status: 408 }
      )
    }

    // Error específico de API key no configurada
    if (error.message?.includes('API key no está configurada') || error.message?.includes('no está configurada')) {
      return NextResponse.json(
        { error: error.message || 'OpenAI API key no está configurada. Ve a Settings para configurarla.' },
        { status: 500 }
      )
    }

    // Otros errores de OpenAI
    if (error.message?.includes('OpenAI') || error.message?.includes('OpenAI API error')) {
      return NextResponse.json(
        { error: error.message || 'Error al procesar con OpenAI. Verifica que la API key esté configurada en Settings.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error desconocido al generar tareas' },
      { status: 500 }
    )
  }
}






