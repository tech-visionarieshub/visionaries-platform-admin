import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { trelloService } from '@/lib/services/trello-service'

/**
 * Endpoint para verificar el estado de conexión de Trello del usuario
 * GET /api/trello/status
 */

export async function GET(request: NextRequest) {
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
    const userId = decoded.uid || decoded.email || 'unknown'

    // Obtener tokens del usuario
    const userTokens = await trelloService.getUserTokens(userId)
    
    if (!userTokens) {
      return NextResponse.json({
        connected: false,
      })
    }

    // Intentar obtener boards para verificar que el token funciona
    try {
      await trelloService.getBoards(userTokens.token, userTokens.tokenSecret)
      return NextResponse.json({
        connected: true,
        boardId: userTokens.boardId,
      })
    } catch (error) {
      // Si falla, el token puede haber expirado o sido revocado
      return NextResponse.json({
        connected: false,
        error: 'Token inválido o expirado',
      })
    }
  } catch (error: any) {
    console.error('[Trello Status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error verificando estado de Trello' },
      { status: 500 }
    )
  }
}

