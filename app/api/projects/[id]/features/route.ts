import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { featuresRepository } from '@/lib/repositories/features-repository'
import type { Feature, FeatureStatus, FeaturePriority } from '@/types/feature'
import { z } from 'zod'
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

/**
 * API CRUD para Features (Funcionalidades)
 * GET /api/projects/[id]/features - Listar todas las funcionalidades
 * POST /api/projects/[id]/features - Crear nueva funcionalidad
 */

const createFeatureSchema = z.object({
  epicTitle: z.string().min(1, 'El epic es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional().default(''),
  criteriosAceptacion: z.string().optional(),
  comentarios: z.string().optional(),
  tipo: z.enum(['Funcionalidad', 'QA', 'Bug']).optional(),
  categoria: z.enum(['Funcionalidad', 'QA', 'Bugs Generales', 'Otra']).optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done', 'completed']).optional().default('backlog'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  assignee: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  githubBranch: z.string().optional(),
  commits: z.number().optional(),
  storyPoints: z.number().optional(),
  sprint: z.string().optional(),
})

type ProjectParamsContext = {
  params: Promise<{ id: string }>
}

/**
 * Crea una tarea QA automáticamente cuando una funcionalidad se marca como done
 */
async function createQATaskFromFeature(projectId: string, feature: Feature, createdBy: string): Promise<string> {
  const qaTask = await qaTasksRepository.create(projectId, {
    featureId: feature.id,
    featureTitle: feature.title,
    titulo: feature.title,
    categoria: 'Funcionalidad',
    tipo: 'Funcionalidad',
    criterios_aceptacion: '',
    comentarios: feature.description || '',
    imagenes: [],
    estado: 'Pendiente',
    createdBy,
    projectId,
  })

  return qaTask.id
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

    // Obtener filtros de query params
    const { searchParams } = new URL(request.url)
    const epicFilter = searchParams.get('epic')
    const statusFilter = searchParams.get('status')
    const priorityFilter = searchParams.get('priority')

    let features = await featuresRepository.getAll(id)

    // Aplicar filtros
    if (epicFilter) {
      features = features.filter(f => f.epicTitle === epicFilter)
    }
    if (statusFilter) {
      features = features.filter(f => f.status === statusFilter)
    }
    if (priorityFilter) {
      features = features.filter(f => f.priority === priorityFilter)
    }

    return NextResponse.json({
      success: true,
      features,
      count: features.length,
    })
  } catch (error: any) {
    console.error('[Features GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener funcionalidades' },
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
    const validatedData = createFeatureSchema.parse(body)

    // Obtener nombre del proyecto para generar ID
    const projectDoc = await getInternalFirestore().collection('projects').doc(id).get()
    const projectName = projectDoc.data()?.name

    const newFeature = await featuresRepository.create(id, {
      ...validatedData,
      createdBy: decoded.email || decoded.uid || 'unknown',
      projectId: id,
    }, projectName)

    return NextResponse.json({
      success: true,
      feature: newFeature,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Features POST] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear funcionalidad' },
      { status: 500 }
    )
  }
}

