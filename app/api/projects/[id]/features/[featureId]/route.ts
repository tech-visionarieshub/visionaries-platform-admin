import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { featuresRepository } from '@/lib/repositories/features-repository'
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository'
import type { FeatureStatus } from '@/types/feature'
import { z } from 'zod'

/**
 * API para operaciones individuales de Features
 * PUT /api/projects/[id]/features/[featureId] - Actualizar funcionalidad
 * DELETE /api/projects/[id]/features/[featureId] - Eliminar funcionalidad
 */

const updateFeatureSchema = z.object({
  epicTitle: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  criteriosAceptacion: z.string().optional(),
  comentarios: z.string().optional(),
  tipo: z.enum(['Funcionalidad', 'QA', 'Bug']).optional(),
  categoria: z.enum(['Funcionalidad', 'QA', 'Bugs Generales', 'Otra']).optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done', 'completed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().optional(),
  githubBranch: z.string().optional(),
  commits: z.number().optional(),
  storyPoints: z.number().optional(),
  sprint: z.string().optional(),
})

type FeatureParamsContext = {
  params: Promise<{ id: string; featureId: string }>
}

/**
 * Crea una tarea QA automáticamente cuando una funcionalidad se marca como done
 */
async function createQATaskFromFeature(projectId: string, feature: any, createdBy: string): Promise<string> {
  const qaTask = await qaTasksRepository.create(projectId, {
    featureId: feature.id,
    featureTitle: feature.title,
    titulo: feature.title,
    categoria: feature.categoria || 'Funcionalidad',
    tipo: feature.tipo || 'Funcionalidad',
    criterios_aceptacion: feature.criteriosAceptacion || '',
    comentarios: feature.comentarios || feature.description || '', // Usar comentarios si existe, sino description
    imagenes: [],
    estado: 'Pendiente',
    createdBy,
    projectId,
  })

  return qaTask.id
}

export async function PUT(
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

    const body = await request.json()
    const validatedData = updateFeatureSchema.parse(body)

    // Obtener la funcionalidad actual
    const currentFeature = await featuresRepository.getById(id, featureId)
    if (!currentFeature) {
      return NextResponse.json(
        { error: 'Funcionalidad no encontrada' },
        { status: 404 }
      )
    }

    // Lógica crítica: Si status cambia a 'done' o 'completed'
    const newStatus = validatedData.status
    const wasDone = currentFeature.status === 'done' || currentFeature.status === 'completed'
    const willBeDone = newStatus === 'done' || newStatus === 'completed'

    let qaTaskId = currentFeature.qaTaskId

    // Si cambia a done/completed y no tiene qaTaskId, crear tarea QA automáticamente
    if (!wasDone && willBeDone && !qaTaskId) {
      qaTaskId = await createQATaskFromFeature(
        id,
        currentFeature,
        decoded.email || decoded.uid || 'unknown'
      )
      
      // Agregar qaTaskId a los updates
      validatedData.qaTaskId = qaTaskId as any
      
      // Cambiar status a 'completed' si era 'done'
      if (newStatus === 'done') {
        validatedData.status = 'completed' as FeatureStatus
      }
    }

    // Si se marca como done/completed y tiene assignee, agregar horas al responsable
    if (!wasDone && willBeDone && currentFeature.assignee && currentFeature.actualHours) {
      try {
        const { getInternalFirestore } = await import('@/lib/firebase/admin-platform')
        const db = getInternalFirestore()
        
        const projectRef = db.collection('projects').doc(id)
        const projectDoc = await projectRef.get()
        
        if (projectDoc.exists) {
          const projectData = projectDoc.data()
          const userHours = projectData?.userHours || {}
          const currentHours = userHours[currentFeature.assignee] || 0
          const newTotalHours = Math.round((currentHours + currentFeature.actualHours) * 10) / 10
          
          await projectRef.update({
            userHours: {
              ...userHours,
              [currentFeature.assignee]: newTotalHours,
            },
            updatedAt: new Date(),
          })
          
          console.log(`[Features PUT] Agregadas ${currentFeature.actualHours}h a ${currentFeature.assignee} en proyecto ${id}. Total: ${newTotalHours}h`)
        }
      } catch (error: any) {
        console.error('[Features PUT] Error actualizando horas del usuario:', error)
        // No fallar si no se puede actualizar las horas del usuario
      }
    }

    // Asegurar que updatedAt se actualice
    validatedData.updatedAt = new Date() as any

    // Actualizar la funcionalidad
    const updatedFeature = await featuresRepository.update(id, featureId, validatedData)

    console.log(`[Features PUT] Feature ${featureId} actualizada:`, {
      status: updatedFeature.status,
      assignee: updatedFeature.assignee,
      qaTaskId: updatedFeature.qaTaskId,
    })

    return NextResponse.json({
      success: true,
      feature: updatedFeature,
      qaTaskCreated: !wasDone && willBeDone && !currentFeature.qaTaskId,
    })
  } catch (error: any) {
    console.error('[Features PUT] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar funcionalidad' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Obtener la funcionalidad para verificar si tiene qaTaskId
    const feature = await featuresRepository.getById(id, featureId)
    if (!feature) {
      return NextResponse.json(
        { error: 'Funcionalidad no encontrada' },
        { status: 404 }
      )
    }

    // Si tiene qaTaskId, eliminar también la tarea QA asociada
    if (feature.qaTaskId) {
      try {
        await qaTasksRepository.delete(id, feature.qaTaskId)
      } catch (error: any) {
        console.warn('[Features DELETE] Error eliminando tarea QA asociada:', error)
        // Continuar con la eliminación de la funcionalidad aunque falle la QA
      }
    }

    // Eliminar la funcionalidad
    await featuresRepository.delete(id, featureId)

    return NextResponse.json({
      success: true,
      message: 'Funcionalidad eliminada correctamente',
    })
  } catch (error: any) {
    console.error('[Features DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar funcionalidad' },
      { status: 500 }
    )
  }
}

