import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { trelloService } from '@/lib/services/trello-service'

/**
 * Endpoint para desconectar cuenta de Trello del usuario
 * POST /api/trello/disconnect
 */

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

    // Eliminar tokens del usuario
    await trelloService.deleteUserTokens(userId)

    return NextResponse.json({
      success: true,
      message: 'Cuenta de Trello desconectada exitosamente',
    })
  } catch (error: any) {
    console.error('[Trello Disconnect] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error desconectando cuenta de Trello' },
      { status: 500 }
    )
  }
}

