/**
 * API Client para Team del Proyecto
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface TeamMember {
  email: string
  displayName: string
  role: 'member' | 'admin'
}

/**
 * Obtiene los miembros del equipo de un proyecto
 */
export async function getProjectTeam(projectId: string): Promise<TeamMember[]> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/team`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al obtener miembros del equipo')
    }

    const data = await response.json()
    return data.teamMembers || []
  } catch (error: any) {
    console.error('[Project Team API] Error getting team:', error)
    throw error
  }
}

/**
 * Agrega un miembro al equipo del proyecto
 */
export async function addTeamMember(projectId: string, email: string): Promise<void> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al agregar miembro al equipo')
    }
  } catch (error: any) {
    console.error('[Project Team API] Error adding team member:', error)
    throw error
  }
}

/**
 * Remueve un miembro del equipo del proyecto
 */
export async function removeTeamMember(projectId: string, email: string): Promise<void> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/team?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al remover miembro del equipo')
    }
  } catch (error: any) {
    console.error('[Project Team API] Error removing team member:', error)
    throw error
  }
}













