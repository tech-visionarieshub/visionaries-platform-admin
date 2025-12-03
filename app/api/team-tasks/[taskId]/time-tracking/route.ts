import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository'
import { Timestamp } from 'firebase-admin/firestore'

type TaskParamsContext = {
  params: Promise<{ taskId: string }>
}

/**
 * API para tracking de tiempo de team tasks
 * POST /api/team-tasks/[taskId]/time-tracking
 * 
 * Body: { action: 'start' | 'pause' | 'complete' }
 */
export async function POST(
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
    const { action } = body

    if (!['start', 'pause', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser: start, pause o complete' },
        { status: 400 }
      )
    }

    // Obtener tarea actual
    const task = await teamTasksRepository.getById(taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    const now = new Date()
    const nowTimestamp = Timestamp.now()
    let updates: any = {}

    if (action === 'start') {
      // Si ya está corriendo, ignorar
      if (task.startedAt) {
        return NextResponse.json({
          success: true,
          message: 'El timer ya está corriendo',
          task,
        })
      }

      // Iniciar timer
      updates.startedAt = nowTimestamp
      updates.status = 'in-progress'
    } else if (action === 'pause') {
      // Si no está corriendo, ignorar
      if (!task.startedAt) {
        return NextResponse.json({
          success: true,
          message: 'No hay timer corriendo',
          task,
        })
      }

      // Calcular tiempo transcurrido
      const startedAtDate = task.startedAt instanceof Date 
        ? task.startedAt 
        : (task.startedAt as any)?.toDate?.() || new Date(task.startedAt)
      
      const elapsedSeconds = Math.floor((now.getTime() - startedAtDate.getTime()) / 1000)
      const currentAccumulated = task.accumulatedTime || 0
      const newAccumulated = currentAccumulated + elapsedSeconds

      // Actualizar tiempo acumulado
      updates.accumulatedTime = newAccumulated
      updates.startedAt = null // Detener timer
      // No cambiar status, solo pausar
    } else if (action === 'complete') {
      // Si está corriendo, primero pausar y sumar tiempo
      if (task.startedAt) {
        const startedAtDate = task.startedAt instanceof Date 
          ? task.startedAt 
          : (task.startedAt as any)?.toDate?.() || new Date(task.startedAt)
        
        const elapsedSeconds = Math.floor((now.getTime() - startedAtDate.getTime()) / 1000)
        const currentAccumulated = task.accumulatedTime || 0
        const newAccumulated = currentAccumulated + elapsedSeconds

        updates.accumulatedTime = newAccumulated
        updates.startedAt = null
      }

      // Calcular horas reales (redondeado a 1 decimal)
      const totalSeconds = updates.accumulatedTime || task.accumulatedTime || 0
      const actualHours = Math.round((totalSeconds / 3600) * 10) / 10

      updates.actualHours = actualHours
      updates.status = 'completed'
    }

    // Actualizar tarea
    const updatedTask = await teamTasksRepository.update(taskId, updates)

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Timer ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'completado'}`,
    })
  } catch (error: any) {
    console.error('[Team Task Time Tracking API] Error:', error)
    return NextResponse.json(
      { error: 'Error en tracking de tiempo', message: error.message },
      { status: 500 }
    )
  }
}







