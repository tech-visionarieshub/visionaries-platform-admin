import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { trelloService } from '@/lib/services/trello-service'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

/**
 * Endpoint para iniciar el flujo OAuth de Trello
 * POST /api/trello/auth
 * 
 * Retorna: { authUrl: string, requestToken: string }
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

    // Obtener callback URL desde variables de entorno o construirla
    const callbackUrl = process.env.TRELLO_CALLBACK_URL || 
      `${request.headers.get('origin') || request.nextUrl.origin}/api/trello/callback`

    // Obtener request token
    const { token: requestToken, tokenSecret, authUrl } = await trelloService.getRequestToken(callbackUrl)

    // Guardar request token temporalmente en Firestore (se usará en el callback)
    const db = getInternalFirestore()
    const userId = decoded.uid || decoded.email || 'unknown'
    
    await db.collection('trello-oauth-temp').doc(userId).set({
      requestToken,
      requestTokenSecret: tokenSecret,
      createdAt: new Date(),
    }, { merge: true })

    return NextResponse.json({
      success: true,
      authUrl,
      requestToken, // Para debugging, puede removerse en producción
    })
  } catch (error: any) {
    console.error('[Trello Auth] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error iniciando autorización de Trello' },
      { status: 500 }
    )
  }
}

