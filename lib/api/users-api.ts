/**
 * API Client para Usuarios
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface User {
  id: string
  email: string
  displayName: string
  role: 'member' | 'admin'
  createdAt?: Date
}

/**
 * Obtiene todos los usuarios globales
 */
export async function getUsers(): Promise<User[]> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al obtener usuarios')
    }

    const data = await response.json()
    return data.users || []
  } catch (error: any) {
    console.error('[Users API] Error getting users:', error)
    throw error
  }
}








