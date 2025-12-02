import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository'
import { z } from 'zod'
import { TEAM_TASK_CATEGORIES } from '@/types/team-task'

/**
 * API para operaciones individuales de Team Tasks
 * GET /api/team-tasks/[taskId] - Obtener tarea
 * PUT /api/team-tasks/[taskId] - Actualizar tarea
 * DELETE /api/team-tasks/[taskId] - Eliminar tarea
 */

type TaskParamsContext = {
  params: Promise<{ taskId: string }>
}

const updateTeamTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(TEAM_TASK_CATEGORIES as [string, ...string[]]).optional(),
  customCategory: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'review', 'completed', 'cancelled']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee: z.string().optional(),
  projectId: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : undefined),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  comentarios: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  context: TaskParamsContext
) {
  const { taskId } = await context.params

  try {
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

    const task = await teamTasksRepository.getById(taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
    })
  } catch (error: any) {
    console.error('[Team Tasks API] Error:', error)
    return NextResponse.json(
      { error: 'Error obteniendo la tarea', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: TaskParamsContext
) {
  const { taskId } = await context.params

  try {
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

    const body = await request.json()
    const validatedData = updateTeamTaskSchema.parse(body)

    // Obtener la tarea existente para comparar cambios
    const existingTask = await teamTasksRepository.getById(taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Si la categoría es "Otra" pero no hay customCategory, mantener el existente o usar título
    if (validatedData.category === 'Otra' && !validatedData.customCategory) {
      if (!existingTask.customCategory) {
        validatedData.customCategory = existingTask.title
      }
    }

    const updatedTask = await teamTasksRepository.update(taskId, validatedData)

    // Enviar email si el assignee cambió y es diferente al creador
    const newAssignee = validatedData.assignee !== undefined ? validatedData.assignee : existingTask.assignee
    const oldAssignee = existingTask.assignee
    const creatorEmail = existingTask.createdBy

    if (newAssignee && newAssignee !== oldAssignee && newAssignee !== creatorEmail) {
      try {
        const { sendTaskAssignedEmail } = await import('@/lib/services/team-task-email-service')
        // Enviar email en background (no esperar respuesta)
        sendTaskAssignedEmail(updatedTask, newAssignee, creatorEmail).catch(error => {
          console.error('[Team Tasks API] Error enviando email de notificación:', error)
          // No fallar la actualización de la tarea si el email falla
        })
      } catch (error) {
        console.error('[Team Tasks API] Error importando servicio de email:', error)
        // No fallar la actualización de la tarea si el email falla
      }
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
    })
  } catch (error: any) {
    console.error('[Team Tasks API] Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error actualizando la tarea', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: TaskParamsContext
) {
  const { taskId } = await context.params

  try {
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

    await teamTasksRepository.delete(taskId)

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    })
  } catch (error: any) {
    console.error('[Team Tasks API] Error:', error)
    return NextResponse.json(
      { error: 'Error eliminando la tarea', message: error.message },
      { status: 500 }
    )
  }
}



