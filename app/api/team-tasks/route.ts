import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository'
import type { TeamTask, TeamTaskStatus, TeamTaskPriority, TeamTaskCategory } from '@/types/team-task'
import { z } from 'zod'
import { TEAM_TASK_CATEGORIES } from '@/types/team-task'

/**
 * API CRUD para Team Tasks (Tareas del Equipo)
 * GET /api/team-tasks - Listar todas las tareas
 * POST /api/team-tasks - Crear nueva tarea
 */

const createTeamTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  category: z.enum(TEAM_TASK_CATEGORIES as [string, ...string[]]),
  customCategory: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'review', 'completed', 'cancelled']).optional().default('pending'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  assignee: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  comentarios: z.string().optional(),
})

export async function GET(request: NextRequest) {
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

    // Obtener filtros de query params
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') as TeamTaskStatus | null
    const assigneeFilter = searchParams.get('assignee')
    const projectIdFilter = searchParams.get('projectId')
    const categoryFilter = searchParams.get('category') as TeamTaskCategory | null

    const filters: {
      status?: TeamTaskStatus
      assignee?: string
      projectId?: string
      category?: TeamTaskCategory
    } = {}

    if (statusFilter) filters.status = statusFilter
    if (assigneeFilter) filters.assignee = assigneeFilter
    if (projectIdFilter) filters.projectId = projectIdFilter
    if (categoryFilter) filters.category = categoryFilter

    const tasks = await teamTasksRepository.getAll(filters)

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    })
  } catch (error: any) {
    console.error('[Team Tasks API] Error:', error)
    return NextResponse.json(
      { error: 'Error obteniendo tareas del equipo', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = createTeamTaskSchema.parse(body)

    // Si la categoría es "Otra" pero no hay customCategory, usar el título como fallback
    if (validatedData.category === 'Otra' && !validatedData.customCategory) {
      validatedData.customCategory = validatedData.title
    }

    const creatorEmail = decoded.email || 'unknown'
    const assigneeEmail = validatedData.assignee || creatorEmail

    const task = await teamTasksRepository.create({
      ...validatedData,
      createdBy: creatorEmail,
      assignee: assigneeEmail || undefined,
    })

    // Enviar email si el assignee es diferente al creador
    if (assigneeEmail && assigneeEmail !== creatorEmail) {
      console.log('[Team Tasks API] Intentando enviar email de asignación al crear tarea:', {
        taskId: task.id,
        assigneeEmail,
        creatorEmail,
      })
      
      try {
        const { sendTaskAssignedEmail } = await import('@/lib/services/team-task-email-service')
        console.log('[Team Tasks API] Servicio de email importado correctamente')
        
        // Enviar email y esperar respuesta para guardar el estado
        const emailResult = await sendTaskAssignedEmail(task, assigneeEmail, creatorEmail)
        console.log('[Team Tasks API] Resultado del envío de email:', emailResult)
        
        // Actualizar la tarea con el estado del envío de correo
        if (emailResult.success) {
          console.log('[Team Tasks API] Email enviado exitosamente, actualizando estado de la tarea')
          await teamTasksRepository.update(task.id, {
            assignmentEmailSent: true,
            assignmentEmailSentAt: new Date(),
          })
          // Recargar la tarea para retornarla con el estado actualizado
          const updatedTask = await teamTasksRepository.getById(task.id)
          return NextResponse.json({
            success: true,
            task: updatedTask,
          })
        } else {
          // Guardar que falló el envío
          console.error('[Team Tasks API] Error enviando email de notificación:', emailResult.error)
          await teamTasksRepository.update(task.id, {
            assignmentEmailSent: false,
          })
          const updatedTask = await teamTasksRepository.getById(task.id)
          return NextResponse.json({
            success: true,
            task: updatedTask,
          })
        }
      } catch (error: any) {
        console.error('[Team Tasks API] Error en el proceso de envío de email:', {
          error: error.message,
          stack: error.stack,
          name: error.name,
        })
        // Guardar que falló el envío
        try {
          await teamTasksRepository.update(task.id, {
            assignmentEmailSent: false,
          })
        } catch (updateError: any) {
          console.error('[Team Tasks API] Error actualizando estado de email:', {
            error: updateError.message,
            stack: updateError.stack,
          })
        }
        // No fallar la creación de la tarea si el email falla
        const updatedTask = await teamTasksRepository.getById(task.id)
        return NextResponse.json({
          success: true,
          task: updatedTask,
        })
      }
    } else {
      console.log('[Team Tasks API] No se envía email porque:', {
        assigneeEmail,
        creatorEmail,
        shouldSend: assigneeEmail && assigneeEmail !== creatorEmail,
      })
    }

    return NextResponse.json({
      success: true,
      task,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Team Tasks API] Error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error creando tarea del equipo', message: error.message },
      { status: 500 }
    )
  }
}



