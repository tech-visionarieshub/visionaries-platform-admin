/**
 * API Client para Time Tracking de Features
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export type TimeTrackingAction = 'start' | 'pause' | 'complete'

/**
 * Ejecuta una acción de time tracking en una feature
 */
export async function trackFeatureTime(
  projectId: string,
  featureId: string,
  action: TimeTrackingAction
): Promise<{ success: boolean; feature: any; message: string }> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/${featureId}/time-tracking`, {
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
    console.error('[Time Tracking API] Error:', error)
    throw error
  }
}




