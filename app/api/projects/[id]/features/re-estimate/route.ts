import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { featuresRepository } from '@/lib/repositories/features-repository'
import { openAIService } from '@/lib/services/openai-service'

type ProjectParamsContext = {
  params: Promise<{ id: string }>
}

/**
 * API para re-estimar features existentes con IA
 * POST /api/projects/[id]/features/re-estimate
 * 
 * Re-estima prioridad y horas estimadas para todas las features del proyecto
 */
export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id: projectId } = await context.params

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

    // Obtener todas las features del proyecto
    const features = await featuresRepository.getAll(projectId)
    
    if (features.length === 0) {
      return NextResponse.json(
        { error: 'No hay funcionalidades para estimar' },
        { status: 400 }
      )
    }

    console.log(`[Re-estimate] Estimando ${features.length} features con IA...`)

    // Estimar en lotes de 10
    const batchSize = 10
    let updatedCount = 0
    const errors: string[] = []

    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize)
      
      try {
        const estimations = await openAIService.estimateFeatureDetails(
          batch.map(f => ({
            title: f.title,
            description: f.description,
            epicTitle: f.epicTitle,
            criteriosAceptacion: f.criteriosAceptacion,
          }))
        )

        // Actualizar cada feature con las estimaciones
        for (let j = 0; j < batch.length; j++) {
          const feature = batch[j]
          const estimation = estimations[j]
          
          if (estimation) {
            try {
              await featuresRepository.update(projectId, feature.id, {
                estimatedHours: estimation.estimatedHours,
                priority: estimation.priority,
              })
              updatedCount++
            } catch (error: any) {
              console.error(`[Re-estimate] Error actualizando feature ${feature.id}:`, error)
              errors.push(`Error actualizando ${feature.title}: ${error.message}`)
            }
          }
        }
      } catch (error: any) {
        console.error(`[Re-estimate] Error estimando batch ${i / batchSize + 1}:`, error)
        errors.push(`Error estimando lote ${i / batchSize + 1}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se estimaron ${updatedCount} de ${features.length} funcionalidades`,
      updatedCount,
      totalCount: features.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[Re-estimate API] Error:', error)
    return NextResponse.json(
      { error: 'Error al re-estimar funcionalidades', message: error.message },
      { status: 500 }
    )
  }
}

