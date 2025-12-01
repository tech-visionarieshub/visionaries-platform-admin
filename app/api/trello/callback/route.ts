import { NextRequest, NextResponse } from 'next/server'
import { trelloService } from '@/lib/services/trello-service'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

/**
 * Endpoint callback de OAuth de Trello
 * GET /api/trello/callback?oauth_token=...&oauth_verifier=...
 * 
 * Intercambia el verifier por access token y guarda los tokens del usuario
 * Retorna una página HTML que comunica el resultado al popup padre
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oauthToken = searchParams.get('oauth_token')
    const oauthVerifier = searchParams.get('oauth_verifier')

    if (!oauthToken || !oauthVerifier) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Trello OAuth</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'TRELLO_OAUTH_ERROR',
                error: 'missing_params',
                message: 'Faltan parámetros en la respuesta de Trello'
              }, '*');
              window.close();
            </script>
            <p>Faltan parámetros. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Buscar request token en Firestore
    const db = getInternalFirestore()
    const tempDocs = await db.collection('trello-oauth-temp')
      .where('requestToken', '==', oauthToken)
      .limit(1)
      .get()

    if (tempDocs.empty) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Trello OAuth</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'TRELLO_OAUTH_ERROR',
                error: 'token_not_found',
                message: 'No se encontró el token de autorización'
              }, '*');
              window.close();
            </script>
            <p>Token no encontrado. Esta ventana se cerrará automáticamente.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      })
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

    // Retornar página HTML que comunica éxito al popup padre
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trello OAuth</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'TRELLO_OAUTH_SUCCESS',
              message: 'Trello conectado exitosamente'
            }, '*');
            window.close();
          </script>
          <p>Autorización exitosa. Esta ventana se cerrará automáticamente.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    console.error('[Trello Callback] Error:', error)
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trello OAuth</title>
        </head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'TRELLO_OAUTH_ERROR',
              error: '${error.name || 'unknown'}',
              message: '${error.message || 'Error desconocido'}'
            }, '*');
            window.close();
          </script>
          <p>Error: ${error.message || 'Error desconocido'}. Esta ventana se cerrará automáticamente.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}


