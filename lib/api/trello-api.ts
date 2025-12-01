/**
 * API Client para Trello Integration
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Inicia el flujo OAuth de Trello
 */
export async function connectTrello(): Promise<{ authUrl: string }> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/trello/auth`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error iniciando conexión con Trello')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('[Trello API] Error conectando:', error)
    throw error
  }
}

/**
 * Verifica si el usuario tiene Trello conectado
 */
export async function getTrelloConnectionStatus(): Promise<{ connected: boolean }> {
  try {
    const token = await getIdToken()
    if (!token) {
      return { connected: false }
    }

    // Intentar obtener boards (si falla, no está conectado)
    const response = await fetch(`${API_BASE}/api/trello/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return { connected: false }
    }

    return { connected: true }
  } catch (error) {
    return { connected: false }
  }
}

/**
 * Desconecta la cuenta de Trello del usuario
 */
export async function disconnectTrello(): Promise<void> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/trello/disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error desconectando Trello')
    }
  } catch (error: any) {
    console.error('[Trello API] Error desconectando:', error)
    throw error
  }
}

/**
 * Sincroniza tarjetas de Trello como tareas del equipo
 */
export async function syncTrelloTasks(options?: {
  boardId?: string
  listIds?: string[]
}): Promise<{
  success: boolean
  message: string
  results: {
    created: number
    updated: number
    skipped: number
    errors: string[]
  }
}> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/team-tasks/sync-trello`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options || {}),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error sincronizando con Trello')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('[Trello API] Error sincronizando:', error)
    throw error
  }
}

