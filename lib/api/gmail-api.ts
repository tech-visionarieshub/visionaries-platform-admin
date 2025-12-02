/**
 * API Client para Gmail
 */

import { getIdToken } from '@/lib/firebase/visionaries-tech'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export interface EmailMessage {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  body: string
  htmlBody?: string
  attachments?: Array<{
    filename: string
    content: string // Base64 encoded
    contentType?: string
  }>
}

export interface GmailConfig {
  configured: boolean
  maskedInfo?: {
    project_id: string
    client_email: string
  }
  usingCalendarConfig?: boolean
}

export interface GmailConnectionStatus {
  connected: boolean
  email?: string
  error?: string
}

export interface SendEmailResponse {
  success: boolean
  messageId?: string
  message?: string
  error?: string
  details?: any
}

/**
 * Obtiene la configuración de Gmail
 */
export async function getGmailConfig(): Promise<GmailConfig> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/config/gmail`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener configuración de Gmail')
    }

    return response.json()
  } catch (error: any) {
    console.error('[Gmail API] Error obteniendo configuración:', error)
    throw error
  }
}

/**
 * Guarda la configuración de Gmail (Service Account JSON)
 */
export async function saveGmailConfig(serviceAccountJson: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/config/gmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ serviceAccountJson }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(error.error || 'Error al guardar configuración de Gmail')
    }

    return response.json()
  } catch (error: any) {
    console.error('[Gmail API] Error guardando configuración:', error)
    throw error
  }
}

/**
 * Verifica la conexión con Gmail
 */
export async function verifyGmailConnection(): Promise<GmailConnectionStatus> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/gmail/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      return {
        connected: false,
        error: error.error || 'Error al verificar conexión con Gmail',
      }
    }

    return response.json()
  } catch (error: any) {
    console.error('[Gmail API] Error verificando conexión:', error)
    return {
      connected: false,
      error: error.message || 'Error desconocido',
    }
  }
}

/**
 * Envía un email usando Gmail API
 */
export async function sendEmail(message: EmailMessage): Promise<SendEmailResponse> {
  try {
    const token = await getIdToken()
    if (!token) {
      throw new Error('No hay token disponible')
    }

    const response = await fetch(`${API_BASE}/api/gmail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
      return {
        success: false,
        error: error.error || 'Error al enviar email',
        details: error.details,
      }
    }

    return response.json()
  } catch (error: any) {
    console.error('[Gmail API] Error enviando email:', error)
    return {
      success: false,
      error: error.message || 'Error desconocido',
    }
  }
}

