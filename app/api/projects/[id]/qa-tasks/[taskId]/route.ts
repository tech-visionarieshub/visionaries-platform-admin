import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository'
import type { QATask } from '@/types/qa'
import { z } from 'zod'

const updateTaskSchema = z.object({
  titulo: z.string().min(1).optional(),
  categoria: z.enum(['Funcionalidad', 'QA', 'Bugs Generales', 'Otra']).optional(),
  tipo: z.string().optional(),
  criterios_aceptacion: z.string().optional(),
  comentarios: z.string().optional(),
  estado: z.enum(['Pendiente', 'En Progreso', 'Completado', 'Bloqueado', 'Cancelado']).optional(),
  prioridad: z.enum(['high', 'medium', 'low']).optional(),
  imagenes: z.array(z.object({
    url: z.string(),
    name: z.string(),
    uploadedAt: z.string().or(z.date()),
    size: z.number(),
  })).optional(),
  featureId: z.string().optional(),
  featureTitle: z.string().optional(),
  featureNote: z.string().optional(),
}).partial()

type TaskParamsContext = {
  params: Promise<{ id: string; taskId: string }>
}

async function ensureAuth(request: NextRequest) {
  const token = extractBearerToken(request)
  if (!token) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const decoded = await verifyIdToken(token)
  const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true
  const hasInternalAccess = decoded.internal === true

  if (!hasInternalAccess && !isSuperAdmin) {
    return { error: NextResponse.json({ error: 'No tienes acceso a esta funcionalidad' }, { status: 403 }) }
  }

  return { decoded }
}

export async function GET(
  request: NextRequest,
  context: TaskParamsContext
) {
  const { id, taskId } = await context.params

  try {
    const auth = await ensureAuth(request)
    if (auth.error) return auth.error

    const task = await qaTasksRepository.getById(id, taskId)

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
    console.error('[QA Task GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener tarea QA' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: TaskParamsContext
) {
  const { id, taskId } = await context.params

  try {
    const auth = await ensureAuth(request)
    if (auth.error) return auth.error

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Validar que solo uno de featureId o featureNote esté presente
    if (validatedData.featureId && validatedData.featureNote) {
      return NextResponse.json(
        { error: 'No se puede especificar featureId y featureNote al mismo tiempo' },
        { status: 400 }
      )
    }

    // Si se actualiza featureId, validar que la funcionalidad existe y obtener featureTitle
    if (validatedData.featureId !== undefined) {
      if (validatedData.featureId) {
        const { featuresRepository } = await import('@/lib/repositories/features-repository')
        const feature = await featuresRepository.getById(id, validatedData.featureId)
        if (!feature) {
          return NextResponse.json(
            { error: 'La funcionalidad especificada no existe' },
            { status: 400 }
          )
        }
        // Si tiene featureId, agregar featureTitle automáticamente y limpiar featureNote
        validatedData.featureTitle = feature.title
        validatedData.featureNote = undefined
      } else {
        // Si featureId es null/empty, limpiar también featureTitle
        validatedData.featureTitle = undefined
      }
    }

    // Si se actualiza featureNote, limpiar featureId y featureTitle
    if (validatedData.featureNote !== undefined && validatedData.featureNote) {
      validatedData.featureId = undefined
      validatedData.featureTitle = undefined
    }

    const existingTask = await qaTasksRepository.getById(id, taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    const updateData: Partial<QATask> = { ...validatedData }

    // Asegurar que el estado se incluya si está presente en el body
    // Esto es importante porque el schema es opcional y podría no incluir el campo si no cambió
    if (body.estado !== undefined && body.estado !== null) {
      // Validar que el estado sea uno de los valores permitidos
      const validStatuses = ['Pendiente', 'En Progreso', 'Completado', 'Bloqueado', 'Cancelado']
      if (validStatuses.includes(body.estado)) {
        updateData.estado = body.estado as QATask['estado']
      }
    }

    console.log('[QA Task PUT] Actualizando tarea:', {
      taskId,
      updateData,
      estadoFromBody: body.estado,
      estadoInValidatedData: validatedData.estado,
      estadoEnUpdateData: updateData.estado,
    })

    if (updateData.imagenes) {
      updateData.imagenes = updateData.imagenes.map((img) => ({
        ...img,
        uploadedAt: typeof img.uploadedAt === 'string' ? new Date(img.uploadedAt) : img.uploadedAt,
      }))
    }

    const updatedTask = await qaTasksRepository.update(id, taskId, updateData)
    
    console.log('[QA Task PUT] Tarea actualizada:', {
      taskId,
      estadoGuardado: updatedTask.estado,
    })

    return NextResponse.json({
      success: true,
      task: updatedTask,
    })
  } catch (error: any) {
    console.error('[QA Task PUT] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar tarea QA' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: TaskParamsContext
) {
  const { id, taskId } = await context.params

  try {
    const auth = await ensureAuth(request)
    if (auth.error) return auth.error

    const existingTask = await qaTasksRepository.getById(id, taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    await qaTasksRepository.delete(id, taskId)

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    })
  } catch (error: any) {
    console.error('[QA Task DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar tarea QA' },
      { status: 500 }
    )
  }
}
