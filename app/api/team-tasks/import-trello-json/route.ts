import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { openAIService } from '@/lib/services/openai-service'
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository'
import type { TeamTask } from '@/types/team-task'

/**
 * Endpoint para importar tareas desde un JSON de Trello usando IA
 * POST /api/team-tasks/import-trello-json
 * 
 * Body: { trelloData: any }
 */
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

    // Obtener datos del body
    const body = await request.json()
    const { trelloData } = body

    if (!trelloData) {
      return NextResponse.json(
        { error: 'No se proporcionaron datos de Trello' },
        { status: 400 }
      )
    }

    // Validar estructura básica del JSON de Trello
    if (!trelloData.cards || !Array.isArray(trelloData.cards)) {
      return NextResponse.json(
        { error: 'El JSON de Trello no tiene la estructura esperada. Debe contener un array "cards".' },
        { status: 400 }
      )
    }

    // Filtrar tarjetas no completadas
    const pendingCards = trelloData.cards.filter((card: any) => {
      if (card.closed === true) return false
      if (card.dueComplete === true) return false
      return true
    })

    if (pendingCards.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay tarjetas pendientes para importar. Todas las tarjetas están completadas o cerradas.',
        results: {
          created: 0,
          skipped: 0,
          errors: [],
        },
      })
    }

    console.log(`[Import Trello JSON] Procesando ${pendingCards.length} tarjetas pendientes de ${trelloData.cards.length} totales`)

    // Usar IA para transformar las tarjetas en tareas
    const generatedTasks = await openAIService.generateTeamTasksFromTrelloJSON(trelloData)

    console.log(`[Import Trello JSON] IA generó ${generatedTasks.length} tareas`)

    // Obtener todas las tareas existentes una sola vez
    const existingTasks = await teamTasksRepository.findAll()

    // Crear tareas en la base de datos
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const taskData of generatedTasks) {
      try {
        // Buscar tarea existente por título (comparación case-insensitive y sin espacios extra)
        const normalizedTitle = taskData.title.toLowerCase().trim()
        const existingTask = existingTasks.find(
          (t: TeamTask) => t.title.toLowerCase().trim() === normalizedTitle
        )

        if (existingTask) {
          // Actualizar tarea existente con los nuevos datos de Trello
          console.log(`[Import Trello JSON] Actualizando tarea existente: "${taskData.title}"`)
          
          const updateData: Partial<TeamTask> = {
            // Actualizar status si es diferente
            status: taskData.status,
            // Actualizar otros campos si tienen valores nuevos
            description: taskData.description || existingTask.description,
            priority: taskData.priority,
            dueDate: taskData.dueDate || existingTask.dueDate,
            estimatedHours: taskData.estimatedHours || existingTask.estimatedHours,
            // Actualizar asignado si viene del JSON
            assignee: taskData.assignee || existingTask.assignee,
            updatedAt: new Date(),
          }

          await teamTasksRepository.update(existingTask.id, updateData)
          results.updated++
        } else {
          // Crear nueva tarea
          const newTask: Omit<TeamTask, 'id' | 'createdAt' | 'updatedAt'> = {
            title: taskData.title,
            description: taskData.description,
            category: taskData.category,
            customCategory: taskData.customCategory,
            status: taskData.status,
            priority: taskData.priority,
            assignee: taskData.assignee,
            dueDate: taskData.dueDate,
            estimatedHours: taskData.estimatedHours,
            createdBy: decoded.email || 'unknown',
          }

          await teamTasksRepository.create(newTask)
          results.created++
        }
      } catch (error: any) {
        console.error(`[Import Trello JSON] Error procesando tarea "${taskData.title}":`, error)
        results.errors.push(`Error en tarea "${taskData.title}": ${error.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${results.created} tareas creadas, ${results.updated} actualizadas, ${results.skipped} con errores`,
      results,
    })
  } catch (error: any) {
    console.error('[Import Trello JSON] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error importando tareas desde Trello JSON' },
      { status: 500 }
    )
  }
}

