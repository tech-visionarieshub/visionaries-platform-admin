import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository'
import type { QATask, QATaskCategory, QATaskStatus } from '@/types/qa'
import { z } from 'zod'

/**
 * API CRUD para tareas QA
 * GET /api/projects/[id]/qa-tasks - Listar todas las tareas
 * POST /api/projects/[id]/qa-tasks - Crear nueva tarea
 */

const createTaskSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  categoria: z.enum(['Funcionalidad', 'QA', 'Bugs Generales', 'Otra']).optional().default('Funcionalidad'),
  tipo: z.string().optional(),
  criterios_aceptacion: z.string().optional().default(''),
  comentarios: z.string().optional().default(''),
  estado: z.enum(['Pendiente', 'En Progreso', 'Completado', 'Bloqueado', 'Cancelado']).optional().default('Pendiente'),
  prioridad: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  imagenes: z.array(z.object({
    url: z.string(),
    name: z.string(),
    uploadedAt: z.string().or(z.date()),
    size: z.number(),
  })).optional().default([]),
  featureId: z.string().optional(),
  featureNote: z.string().optional(),
})

type ProjectParamsContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params

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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as QATaskCategory | null
    const status = searchParams.get('status') as QATaskStatus | null

    let tasks: QATask[]

    if (category) {
      tasks = await qaTasksRepository.getByCategory(id, category)
    } else if (status) {
      tasks = await qaTasksRepository.getByStatus(id, status)
    } else {
      tasks = await qaTasksRepository.getAll(id)
    }

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    })
  } catch (error: any) {
    console.error('[QA Tasks GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener tareas QA' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params

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
    const validatedData = createTaskSchema.parse(body)

    // Validar que si viene featureId, la funcionalidad existe
    if (validatedData.featureId) {
      const { featuresRepository } = await import('@/lib/repositories/features-repository')
      const feature = await featuresRepository.getById(id, validatedData.featureId)
      if (!feature) {
        return NextResponse.json(
          { error: 'La funcionalidad especificada no existe' },
          { status: 400 }
        )
      }
      // Si tiene featureId, agregar featureTitle automáticamente
      validatedData.featureTitle = feature.title
    }

    // Validar que solo uno de featureId o featureNote esté presente
    if (validatedData.featureId && validatedData.featureNote) {
      return NextResponse.json(
        { error: 'No se puede especificar featureId y featureNote al mismo tiempo' },
        { status: 400 }
      )
    }

    const newTask = await qaTasksRepository.create(id, {
      ...validatedData,
      imagenes: validatedData.imagenes?.map(img => ({
        ...img,
        uploadedAt: typeof img.uploadedAt === 'string' ? new Date(img.uploadedAt) : img.uploadedAt,
      })) || [],
      createdBy: decoded.email || decoded.uid || 'unknown',
      projectId: id,
    })

    return NextResponse.json({
      success: true,
      task: newTask,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[QA Tasks POST] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear tarea QA' },
      { status: 500 }
    )
  }
}
