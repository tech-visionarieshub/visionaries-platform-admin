/**
 * API Client para Team Tasks (Tareas del Equipo)
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'
import type { TeamTask } from '@/types/team-task'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Obtiene todas las tareas del equipo, opcionalmente filtradas
 */
export async function getTeamTasks(filters?: {
  status?: TeamTask['status']
  assignee?: string
  projectId?: string
  category?: TeamTask['category']
}): Promise<TeamTask[]> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.assignee) params.append('assignee', filters.assignee)
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.category) params.append('category', filters.category)

    const url = `${API_BASE}/api/team-tasks${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al obtener tareas del equipo')
    }

    const data = await response.json()
    return data.tasks || []
  } catch (error: any) {
    console.error('[Team Tasks API] Error getting tasks:', error)
    throw error
  }
}

/**
 * Obtiene una tarea por ID
 */
export async function getTeamTaskById(id: string): Promise<TeamTask> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al obtener la tarea')
    }

    const data = await response.json()
    return data.task
  } catch (error: any) {
    console.error('[Team Tasks API] Error getting task:', error)
    throw error
  }
}

/**
 * Crea una nueva tarea del equipo
 */
export async function createTeamTask(taskData: Omit<TeamTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamTask> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al crear la tarea')
    }

    const data = await response.json()
    return data.task
  } catch (error: any) {
    console.error('[Team Tasks API] Error creating task:', error)
    throw error
  }
}

/**
 * Actualiza una tarea del equipo
 */
export async function updateTeamTask(id: string, updates: Partial<Omit<TeamTask, 'id' | 'createdAt'>>): Promise<TeamTask> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al actualizar la tarea')
    }

    const data = await response.json()
    return data.task
  } catch (error: any) {
    console.error('[Team Tasks API] Error updating task:', error)
    throw error
  }
}

/**
 * Elimina una tarea del equipo
 */
export async function deleteTeamTask(id: string): Promise<void> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al eliminar la tarea')
    }
  } catch (error: any) {
    console.error('[Team Tasks API] Error deleting task:', error)
    throw error
  }
}

/**
 * Ejecuta una acción de time tracking en una tarea
 */
export type TimeTrackingAction = 'start' | 'pause' | 'complete'

export async function trackTeamTaskTime(
  taskId: string,
  action: TimeTrackingAction
): Promise<{ success: boolean; task: TeamTask; message: string }> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks/${taskId}/time-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al ejecutar acción de tracking')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('[Team Tasks API] Error tracking time:', error)
    throw error
  }
}

/**
 * Genera tareas desde un transcript
 */
export async function generateTeamTasksFromTranscript(
  transcript: string
): Promise<Array<{
  title: string
  description: string
  category: TeamTask['category']
  customCategory?: string
  priority: TeamTask['priority']
  status: TeamTask['status']
  estimatedHours: number
  isPossibleDuplicate?: boolean
  duplicateOf?: string | null
  similarityScore?: number
}>> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks/generate-from-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transcript }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al generar tareas desde transcript')
    }

    const data = await response.json()
    return data.tasks || []
  } catch (error: any) {
    console.error('[Team Tasks API] Error generating tasks from transcript:', error)
    throw error
  }
}

