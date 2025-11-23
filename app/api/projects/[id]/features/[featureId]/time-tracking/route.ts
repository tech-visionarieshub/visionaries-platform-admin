import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { featuresRepository } from '@/lib/repositories/features-repository'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import { Timestamp } from 'firebase-admin/firestore'

type FeatureParamsContext = {
  params: Promise<{ id: string; featureId: string }>
}

/**
 * API para tracking de tiempo de features
 * POST /api/projects/[id]/features/[featureId]/time-tracking
 * 
 * Body: { action: 'start' | 'pause' | 'complete' }
 */
export async function POST(
  request: NextRequest,
  context: FeatureParamsContext
) {
  const { id: projectId, featureId } = await context.params

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
    const { action } = body

    if (!['start', 'pause', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser: start, pause o complete' },
        { status: 400 }
      )
    }

    // Obtener feature actual
    const feature = await featuresRepository.getById(projectId, featureId)
    if (!feature) {
      return NextResponse.json(
        { error: 'Funcionalidad no encontrada' },
        { status: 404 }
      )
    }

    const now = new Date()
    const nowTimestamp = Timestamp.now()
    let updates: any = {}

    if (action === 'start') {
      // Si ya está corriendo, ignorar
      if (feature.startedAt) {
        return NextResponse.json({
          success: true,
          message: 'El timer ya está corriendo',
          feature,
        })
      }

      // Iniciar timer
      updates.startedAt = nowTimestamp
      updates.status = 'in-progress'
    } else if (action === 'pause') {
      // Si no está corriendo, ignorar
      if (!feature.startedAt) {
        return NextResponse.json({
          success: true,
          message: 'No hay timer corriendo',
          feature,
        })
      }

      // Calcular tiempo transcurrido
      const startedAtDate = feature.startedAt instanceof Date 
        ? feature.startedAt 
        : (feature.startedAt as any)?.toDate?.() || new Date(feature.startedAt)
      
      const elapsedSeconds = Math.floor((now.getTime() - startedAtDate.getTime()) / 1000)
      const currentAccumulated = feature.accumulatedTime || 0
      const newAccumulated = currentAccumulated + elapsedSeconds

      // Actualizar tiempo acumulado
      updates.accumulatedTime = newAccumulated
      updates.startedAt = null // Detener timer
      // No cambiar status, solo pausar
    } else if (action === 'complete') {
      // Si está corriendo, primero pausar y sumar tiempo
      if (feature.startedAt) {
        const startedAtDate = feature.startedAt instanceof Date 
          ? feature.startedAt 
          : (feature.startedAt as any)?.toDate?.() || new Date(feature.startedAt)
        
        const elapsedSeconds = Math.floor((now.getTime() - startedAtDate.getTime()) / 1000)
        const currentAccumulated = feature.accumulatedTime || 0
        const newAccumulated = currentAccumulated + elapsedSeconds

        updates.accumulatedTime = newAccumulated
        updates.startedAt = null
      }

      // Calcular horas reales (redondeado a 1 decimal)
      const totalSeconds = updates.accumulatedTime || feature.accumulatedTime || 0
      const actualHours = Math.round((totalSeconds / 3600) * 10) / 10

      updates.actualHours = actualHours
      updates.status = 'done'

      // Agregar horas al responsable del proyecto si existe
      if (feature.assignee) {
        try {
          const db = getInternalFirestore()
          
          // Obtener el documento del proyecto
          const projectRef = db.collection('projects').doc(projectId)
          const projectDoc = await projectRef.get()
          
          if (projectDoc.exists) {
            const projectData = projectDoc.data()
            
            // Obtener o inicializar el objeto de horas por usuario
            const userHours = projectData?.userHours || {}
            const currentHours = userHours[feature.assignee] || 0
            
            // Sumar las horas reales de esta feature
            const newTotalHours = Math.round((currentHours + actualHours) * 10) / 10
            
            // Actualizar el proyecto con las nuevas horas del usuario
            await projectRef.update({
              userHours: {
                ...userHours,
                [feature.assignee]: newTotalHours,
              },
              updatedAt: new Date(),
            })
            
            console.log(`[Time Tracking] Agregadas ${actualHours}h a ${feature.assignee} en proyecto ${projectId}. Total: ${newTotalHours}h`)
          }
        } catch (error: any) {
          // No fallar si no se puede actualizar las horas del usuario, solo loguear
          console.error('[Time Tracking] Error actualizando horas del usuario:', error)
        }
      }
    }

    // Actualizar feature
    const updatedFeature = await featuresRepository.update(projectId, featureId, updates)

    return NextResponse.json({
      success: true,
      feature: updatedFeature,
      message: `Timer ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'completado'}`,
    })
  } catch (error: any) {
    console.error('[Time Tracking API] Error:', error)
    return NextResponse.json(
      { error: 'Error en tracking de tiempo', message: error.message },
      { status: 500 }
    )
  }
}

