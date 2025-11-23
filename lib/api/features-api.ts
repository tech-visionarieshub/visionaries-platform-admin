/**
 * API Client para Features (Funcionalidades)
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'
import type { Feature, FeatureStatus, FeaturePriority } from '@/types/feature'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface GetFeaturesParams {
  epic?: string
  status?: FeatureStatus
  priority?: FeaturePriority
}

export interface CreateFeatureData {
  epicTitle: string
  title: string
  description?: string
  criteriosAceptacion?: string
  comentarios?: string
  tipo?: "Funcionalidad" | "QA" | "Bug"
  categoria?: "Funcionalidad" | "QA" | "Bugs Generales" | "Otra"
  status?: FeatureStatus
  priority?: FeaturePriority
  assignee?: string
  estimatedHours?: number
  actualHours?: number
  githubBranch?: string
  commits?: number
  storyPoints?: number
  sprint?: string
}

export interface UpdateFeatureData extends Partial<CreateFeatureData> {}

/**
 * Obtiene todas las funcionalidades de un proyecto
 */
export async function getFeatures(projectId: string, params?: GetFeaturesParams): Promise<Feature[]> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const queryParams = new URLSearchParams()
    if (params?.epic) queryParams.append('epic', params.epic)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)

    const url = `${API_BASE}/api/projects/${projectId}/features${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al obtener funcionalidades')
    }

    const data = await response.json()
    return data.features || []
  } catch (error: any) {
    console.error('[Features API] Error getting features:', error)
    throw error
  }
}

/**
 * Obtiene una funcionalidad por ID
 */
export async function getFeatureById(projectId: string, featureId: string): Promise<Feature | null> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/${featureId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al obtener funcionalidad')
    }

    const data = await response.json()
    return data.feature || null
  } catch (error: any) {
    console.error('[Features API] Error getting feature by ID:', error)
    throw error
  }
}

/**
 * Crea una nueva funcionalidad
 */
export async function createFeature(projectId: string, featureData: CreateFeatureData): Promise<Feature> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/features`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(featureData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al crear funcionalidad')
    }

    const data = await response.json()
    return data.feature
  } catch (error: any) {
    console.error('[Features API] Error creating feature:', error)
    throw error
  }
}

/**
 * Actualiza una funcionalidad
 */
export async function updateFeature(
  projectId: string,
  featureId: string,
  updates: UpdateFeatureData
): Promise<Feature> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/${featureId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al actualizar funcionalidad')
    }

    const data = await response.json()
    return data.feature
  } catch (error: any) {
    console.error('[Features API] Error updating feature:', error)
    throw error
  }
}

/**
 * Elimina una funcionalidad
 */
export async function deleteFeature(projectId: string, featureId: string): Promise<void> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/${featureId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al eliminar funcionalidad')
    }
  } catch (error: any) {
    console.error('[Features API] Error deleting feature:', error)
    throw error
  }
}

/**
 * Mueve una funcionalidad a QA manualmente
 */
export async function moveFeatureToQA(projectId: string, featureId: string): Promise<{ qaTask: any }> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/projects/${projectId}/features/${featureId}/move-to-qa`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al mover funcionalidad a QA')
    }

    const data = await response.json()
    return { qaTask: data.qaTask }
  } catch (error: any) {
    console.error('[Features API] Error moving feature to QA:', error)
    throw error
  }
}

