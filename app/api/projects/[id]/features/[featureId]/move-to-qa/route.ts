import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { featuresRepository } from '@/lib/repositories/features-repository'
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository'

/**
 * API para mover funcionalidad a QA manualmente
 * POST /api/projects/[id]/features/[featureId]/move-to-qa
 */

type FeatureParamsContext = {
  params: Promise<{ id: string; featureId: string }>
}

export async function POST(
  request: NextRequest,
  context: FeatureParamsContext
) {
  const { id, featureId } = await context.params

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

    // Obtener la funcionalidad
    const feature = await featuresRepository.getById(id, featureId)
    if (!feature) {
      return NextResponse.json(
        { error: 'Funcionalidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si ya tiene tarea QA
    if (feature.qaTaskId) {
      const existingQATask = await qaTasksRepository.getById(id, feature.qaTaskId)
      if (existingQATask) {
        return NextResponse.json({
          success: true,
          message: 'La funcionalidad ya tiene una tarea QA asociada',
          qaTask: existingQATask,
        })
      }
    }

    // Crear tarea QA
    const qaTask = await qaTasksRepository.create(id, {
      featureId: feature.id,
      featureTitle: feature.title,
      titulo: feature.title,
      categoria: feature.categoria || 'Funcionalidad',
      tipo: feature.tipo || 'Funcionalidad',
      criterios_aceptacion: feature.criteriosAceptacion || '',
      comentarios: feature.comentarios || feature.description || '', // Usar comentarios si existe, sino description
      imagenes: [],
      estado: 'Pendiente',
      createdBy: decoded.email || decoded.uid || 'unknown',
      projectId: id,
    })

    // Actualizar funcionalidad con qaTaskId y cambiar status a completed
    await featuresRepository.update(id, featureId, {
      qaTaskId: qaTask.id,
      status: 'completed',
    })

    return NextResponse.json({
      success: true,
      qaTask,
      message: 'Tarea QA creada exitosamente',
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Move to QA] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al mover funcionalidad a QA' },
      { status: 500 }
    )
  }
}

