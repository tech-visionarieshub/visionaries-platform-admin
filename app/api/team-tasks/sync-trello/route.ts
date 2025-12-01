import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { trelloService } from '@/lib/services/trello-service'
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository'
import type { TeamTask } from '@/types/team-task'

/**
 * Endpoint para sincronizar tarjetas de Trello como tareas del equipo
 * POST /api/team-tasks/sync-trello
 * 
 * Body opcional: { boardId?: string, listIds?: string[] }
 */

// Mapeo de listas de Trello a estados de TeamTask
const LIST_TO_STATUS_MAP: Record<string, TeamTask['status']> = {
  'to do': 'pending',
  'todo': 'pending',
  'pendiente': 'pending',
  'doing': 'in-progress',
  'en progreso': 'in-progress',
  'in progress': 'in-progress',
  'review': 'review',
  'revisión': 'review',
  'done': 'completed',
  'completada': 'completed',
  'completado': 'completed',
  'cancelled': 'cancelled',
  'cancelada': 'cancelled',
}

// Mapeo de labels de Trello a prioridades
const LABEL_TO_PRIORITY_MAP: Record<string, TeamTask['priority']> = {
  'alta': 'high',
  'high': 'high',
  'urgente': 'high',
  'urgent': 'high',
  'media': 'medium',
  'medium': 'medium',
  'baja': 'low',
  'low': 'low',
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
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

    const userId = decoded.uid || decoded.email || 'unknown'

    // Obtener tokens del usuario
    const userTokens = await trelloService.getUserTokens(userId)
    if (!userTokens) {
      return NextResponse.json(
        { error: 'No tienes una cuenta de Trello conectada. Conecta tu cuenta primero.' },
        { status: 400 }
      )
    }

    // Obtener parámetros del body
    const body = await request.json().catch(() => ({}))
    const { boardId, listIds } = body

    let cards: any[] = []

    if (listIds && Array.isArray(listIds) && listIds.length > 0) {
      // Obtener tarjetas de listas específicas
      for (const listId of listIds) {
        const listCards = await trelloService.getCardsByList(
          listId,
          userTokens.token,
          userTokens.tokenSecret
        )
        cards.push(...listCards)
      }
    } else if (boardId) {
      // Obtener tarjetas de un board específico
      cards = await trelloService.getCards(
        boardId,
        userTokens.token,
        userTokens.tokenSecret
      )
    } else {
      // Si no se especifica boardId, usar el guardado en los tokens o obtener el primer board
      if (userTokens.boardId) {
        cards = await trelloService.getCards(
          userTokens.boardId,
          userTokens.token,
          userTokens.tokenSecret
        )
      } else {
        // Obtener boards y usar el primero
        const boards = await trelloService.getBoards(
          userTokens.token,
          userTokens.tokenSecret
        )
        if (boards.length === 0) {
          return NextResponse.json(
            { error: 'No se encontraron boards en tu cuenta de Trello' },
            { status: 400 }
          )
        }
        const firstBoard = boards[0]
        cards = await trelloService.getCards(
          firstBoard.id,
          userTokens.token,
          userTokens.tokenSecret
        )
      }
    }

    // Obtener listas para mapear estados
    const listsMap = new Map<string, string>()
    if (boardId || userTokens.boardId) {
      const boardIdToUse = boardId || userTokens.boardId!
      const lists = await trelloService.getLists(
        boardIdToUse,
        userTokens.token,
        userTokens.tokenSecret
      )
      lists.forEach(list => {
        listsMap.set(list.id, list.name.toLowerCase())
      })
    }

    // Obtener miembros para mapear asignados
    const allMemberIds = [...new Set(cards.flatMap(card => card.idMembers || []))]
    const members = await trelloService.getMembers(
      allMemberIds,
      userTokens.token,
      userTokens.tokenSecret
    )
    const membersMap = new Map<string, string>()
    members.forEach(member => {
      if (member.email) {
        membersMap.set(member.id, member.email)
      }
    })

    // Mapear tarjetas a tareas y crear/actualizar
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const card of cards) {
      try {
        // Verificar si ya existe por trelloCardId
        const existingTask = await teamTasksRepository.findByTrelloCardId(card.id)

        // Mapear lista a estado
        const listName = listsMap.get(card.idList) || ''
        const status = LIST_TO_STATUS_MAP[listName] || 'pending'

        // Mapear labels a prioridad
        let priority: TeamTask['priority'] = 'medium'
        if (card.labels && card.labels.length > 0) {
          for (const label of card.labels) {
            const labelName = label.name.toLowerCase()
            if (LABEL_TO_PRIORITY_MAP[labelName]) {
              priority = LABEL_TO_PRIORITY_MAP[labelName]
              break
            }
          }
        }

        // Mapear asignado
        let assignee: string | undefined
        if (card.idMembers && card.idMembers.length > 0) {
          const memberId = card.idMembers[0]
          assignee = membersMap.get(memberId)
        }

        // Mapear fecha de vencimiento
        let dueDate: Date | undefined
        if (card.due) {
          dueDate = new Date(card.due)
        }

        const taskData: Omit<TeamTask, 'id' | 'createdAt' | 'updatedAt'> = {
          title: card.name,
          description: card.desc || undefined,
          category: 'Redes Sociales', // Default para marketing
          status,
          priority,
          assignee,
          dueDate,
          trelloCardId: card.id,
          createdBy: decoded.email || 'unknown',
        }

        if (existingTask) {
          // Actualizar tarea existente
          await teamTasksRepository.update(existingTask.id, {
            ...taskData,
            updatedAt: new Date(),
          })
          results.updated++
        } else {
          // Crear nueva tarea
          await teamTasksRepository.create(taskData)
          results.created++
        }
      } catch (error: any) {
        console.error(`[Sync Trello] Error procesando tarjeta ${card.id}:`, error)
        results.errors.push(`Error en tarjeta "${card.name}": ${error.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${results.created} creadas, ${results.updated} actualizadas, ${results.skipped} con errores`,
      results,
    })
  } catch (error: any) {
    console.error('[Sync Trello] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error sincronizando con Trello' },
      { status: 500 }
    )
  }
}

