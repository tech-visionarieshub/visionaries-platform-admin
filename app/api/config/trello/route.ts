import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

/**
 * Endpoint para configurar credenciales OAuth de Trello
 * GET /api/config/trello - Obtener configuración
 * POST /api/config/trello - Guardar configuración
 */

export async function GET(request: NextRequest) {
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

    if (!isSuperAdmin && !hasInternalAccess) {
      return NextResponse.json(
        { error: 'Solo superadmins o usuarios con acceso interno pueden acceder a esta configuración' },
        { status: 403 }
      )
    }

    const db = getInternalFirestore()
    const configDoc = await db.collection('config').doc('trello').get()

    if (!configDoc.exists) {
      return NextResponse.json({
        configured: false,
        apiKey: null,
        apiSecret: null,
      })
    }

    const data = configDoc.data()
    const apiKey = data?.apiKey
    const apiSecret = data?.apiSecret

    // Enmascarar credenciales
    const maskedKey = apiKey 
      ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`
      : null
    const maskedSecret = apiSecret
      ? `${apiSecret.substring(0, 8)}...${apiSecret.slice(-4)}`
      : null

    return NextResponse.json({
      configured: !!apiKey && !!apiSecret,
      apiKey: maskedKey,
      apiSecret: maskedSecret,
    })
  } catch (error: any) {
    console.error('[Trello Config GET] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!isSuperAdmin && !hasInternalAccess) {
      return NextResponse.json(
        { error: 'Solo superadmins o usuarios con acceso interno pueden configurar Trello' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { apiKey, apiSecret } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API Key es requerida' },
        { status: 400 }
      )
    }

    if (!apiSecret || typeof apiSecret !== 'string') {
      return NextResponse.json(
        { error: 'API Secret es requerido' },
        { status: 400 }
      )
    }

    // Guardar en Firestore
    const db = getInternalFirestore()
    await db.collection('config').doc('trello').set({
      apiKey,
      apiSecret,
      updatedAt: new Date(),
      updatedBy: decoded.email,
    }, { merge: true })

    return NextResponse.json({
      success: true,
      message: 'Credenciales de Trello guardadas exitosamente',
    })
  } catch (error: any) {
    console.error('[Trello Config POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al guardar configuración' },
      { status: 500 }
    )
  }
}

