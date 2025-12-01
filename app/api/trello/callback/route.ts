import { NextRequest, NextResponse } from 'next/server'
import { trelloService } from '@/lib/services/trello-service'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

/**
 * Endpoint callback de OAuth de Trello
 * GET /api/trello/callback?oauth_token=...&oauth_verifier=...
 * 
 * Intercambia el verifier por access token y guarda los tokens del usuario
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oauthToken = searchParams.get('oauth_token')
    const oauthVerifier = searchParams.get('oauth_verifier')

    if (!oauthToken || !oauthVerifier) {
      return NextResponse.redirect(
        new URL('/equipo?trello_error=missing_params', request.url).origin
      )
    }

    // Buscar request token en Firestore
    const db = getInternalFirestore()
    const tempDocs = await db.collection('trello-oauth-temp')
      .where('requestToken', '==', oauthToken)
      .limit(1)
      .get()

    if (tempDocs.empty) {
      return NextResponse.redirect(
        new URL('/equipo?trello_error=token_not_found', request.url).origin
      )
    }

    const tempData = tempDocs.docs[0].data()
    const requestTokenSecret = tempData.requestTokenSecret
    const userId = tempDocs.docs[0].id

    // Intercambiar verifier por access token
    const { token: accessToken, tokenSecret: accessTokenSecret } = 
      await trelloService.getAccessToken(oauthToken, requestTokenSecret, oauthVerifier)

    // Guardar access token del usuario
    await trelloService.saveUserTokens(userId, {
      token: accessToken,
      tokenSecret: accessTokenSecret,
    })

    // Eliminar request token temporal
    await tempDocs.docs[0].ref.delete()

    // Redirigir a la página de equipo con mensaje de éxito
    return NextResponse.redirect(
      new URL('/equipo?trello_connected=true', request.url).origin
    )
  } catch (error: any) {
    console.error('[Trello Callback] Error:', error)
    return NextResponse.redirect(
      new URL(`/equipo?trello_error=${encodeURIComponent(error.message)}`, request.url).origin
    )
  }
}

