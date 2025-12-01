/**
 * Servicio para integración con Trello API usando OAuth 1.0
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import crypto from 'crypto'

const TRELLO_API_BASE = 'https://api.trello.com/1'

export interface TrelloCard {
  id: string
  name: string
  desc: string
  due?: string
  dueComplete: boolean
  idList: string
  idBoard: string
  idMembers: string[]
  labels: Array<{
    id: string
    name: string
    color: string
  }>
  url: string
  dateLastActivity: string
}

export interface TrelloList {
  id: string
  name: string
  idBoard: string
  closed: boolean
}

export interface TrelloBoard {
  id: string
  name: string
  closed: boolean
  url: string
}

export interface TrelloMember {
  id: string
  username: string
  fullName: string
  email?: string
}

export interface TrelloUserToken {
  token: string
  tokenSecret: string
  boardId?: string
  updatedAt: Date
}

export class TrelloService {
  private db = getInternalFirestore()
  private configCollection = this.db.collection('config')
  private tokensCollection = this.db.collection('user-trello-tokens')

  /**
   * Obtiene las credenciales OAuth de Trello desde Firestore
   */
  private async getOAuthCredentials(): Promise<{ apiKey: string; apiSecret: string }> {
    const doc = await this.configCollection.doc('trello').get()
    
    if (!doc.exists) {
      throw new Error('Trello OAuth no está configurado. Configura TRELLO_API_KEY y TRELLO_API_SECRET en Settings.')
    }

    const data = doc.data()
    if (!data?.apiKey || !data?.apiSecret) {
      throw new Error('Trello OAuth no está configurado. Configura TRELLO_API_KEY y TRELLO_API_SECRET en Settings.')
    }

    return {
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
    }
  }

  /**
   * Genera firma OAuth 1.0 para Trello
   */
  private generateOAuthSignature(
    method: string,
    url: string,
    params: Record<string, string>,
    consumerSecret: string,
    tokenSecret: string = ''
  ): string {
    // Ordenar parámetros
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')

    // Crear string base
    const baseString = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams),
    ].join('&')

    // Crear signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`

    // Generar firma HMAC-SHA1
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(baseString)
      .digest('base64')

    return signature
  }

  /**
   * Genera parámetros OAuth 1.0
   */
  private generateOAuthParams(
    consumerKey: string,
    token?: string,
    tokenSecret?: string,
    verifier?: string
  ): Record<string, string> {
    const params: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
    }

    if (token) {
      params.oauth_token = token
    }

    if (verifier) {
      params.oauth_verifier = verifier
    }

    return params
  }

  /**
   * Hace una petición autenticada a Trello API
   */
  private async makeAuthenticatedRequest(
    method: string,
    endpoint: string,
    userToken: string,
    userTokenSecret: string,
    queryParams: Record<string, string> = {}
  ): Promise<any> {
    const { apiKey, apiSecret } = await this.getOAuthCredentials()
    const url = `${TRELLO_API_BASE}${endpoint}`

    // Combinar parámetros OAuth con query params
    const oauthParams = this.generateOAuthParams(apiKey, userToken)
    const allParams = { ...oauthParams, ...queryParams }

    // Generar firma
    const signature = this.generateOAuthSignature(method, url, allParams, apiSecret, userTokenSecret)
    allParams.oauth_signature = signature

    // Construir URL con parámetros
    const paramString = Object.keys(allParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&')

    const fullUrl = `${url}?${paramString}`

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Trello API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Obtiene request token para iniciar flujo OAuth
   */
  async getRequestToken(callbackUrl: string): Promise<{ token: string; tokenSecret: string; authUrl: string }> {
    const { apiKey, apiSecret } = await this.getOAuthCredentials()
    const url = `${TRELLO_API_BASE}/OAuthGetRequestToken`

    const oauthParams = this.generateOAuthParams(apiKey)
    oauthParams.oauth_callback = callbackUrl

    const signature = this.generateOAuthSignature('POST', url, oauthParams, apiSecret)
    oauthParams.oauth_signature = signature

    const paramString = Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paramString,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error obteniendo request token: ${response.status} ${errorText}`)
    }

    const responseText = await response.text()
    const params = new URLSearchParams(responseText)
    const token = params.get('oauth_token')
    const tokenSecret = params.get('oauth_token_secret')

    if (!token || !tokenSecret) {
      throw new Error('No se recibieron token y tokenSecret del request token')
    }

    const authUrl = `https://trello.com/1/OAuthAuthorizeToken?oauth_token=${token}&name=Visionaries%20Platform&expiration=never&scope=read,write`

    return {
      token,
      tokenSecret,
      authUrl,
    }
  }

  /**
   * Intercambia verifier por access token
   */
  async getAccessToken(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string
  ): Promise<{ token: string; tokenSecret: string }> {
    const { apiKey, apiSecret } = await this.getOAuthCredentials()
    const url = `${TRELLO_API_BASE}/OAuthGetAccessToken`

    const oauthParams = this.generateOAuthParams(apiKey, requestToken, requestTokenSecret, verifier)

    const signature = this.generateOAuthSignature('POST', url, oauthParams, apiSecret, requestTokenSecret)
    oauthParams.oauth_signature = signature

    const paramString = Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paramString,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error obteniendo access token: ${response.status} ${errorText}`)
    }

    const responseText = await response.text()
    const params = new URLSearchParams(responseText)
    const token = params.get('oauth_token')
    const tokenSecret = params.get('oauth_token_secret')

    if (!token || !tokenSecret) {
      throw new Error('No se recibieron token y tokenSecret del access token')
    }

    return {
      token,
      tokenSecret,
    }
  }

  /**
   * Guarda tokens de acceso del usuario en Firestore
   */
  async saveUserTokens(userId: string, tokens: { token: string; tokenSecret: string; boardId?: string }): Promise<void> {
    await this.tokensCollection.doc(userId).set({
      token: tokens.token,
      tokenSecret: tokens.tokenSecret,
      boardId: tokens.boardId,
      updatedAt: new Date(),
    })
  }

  /**
   * Obtiene tokens de acceso del usuario desde Firestore
   */
  async getUserTokens(userId: string): Promise<TrelloUserToken | null> {
    const doc = await this.tokensCollection.doc(userId).get()
    
    if (!doc.exists) {
      return null
    }

    const data = doc.data()
    return {
      token: data!.token,
      tokenSecret: data!.tokenSecret,
      boardId: data!.boardId,
      updatedAt: data!.updatedAt.toDate(),
    }
  }

  /**
   * Elimina tokens del usuario
   */
  async deleteUserTokens(userId: string): Promise<void> {
    await this.tokensCollection.doc(userId).delete()
  }

  /**
   * Obtiene boards del usuario
   */
  async getBoards(userToken: string, userTokenSecret: string): Promise<TrelloBoard[]> {
    return this.makeAuthenticatedRequest('GET', '/members/me/boards', userToken, userTokenSecret, {
      filter: 'open',
      fields: 'id,name,closed,url',
    })
  }

  /**
   * Obtiene listas de un board
   */
  async getLists(boardId: string, userToken: string, userTokenSecret: string): Promise<TrelloList[]> {
    return this.makeAuthenticatedRequest('GET', `/boards/${boardId}/lists`, userToken, userTokenSecret, {
      filter: 'open',
      fields: 'id,name,idBoard,closed',
    })
  }

  /**
   * Obtiene tarjetas de un board
   */
  async getCards(boardId: string, userToken: string, userTokenSecret: string): Promise<TrelloCard[]> {
    return this.makeAuthenticatedRequest('GET', `/boards/${boardId}/cards`, userToken, userTokenSecret, {
      filter: 'open',
      fields: 'id,name,desc,due,dueComplete,idList,idBoard,idMembers,labels,url,dateLastActivity',
    })
  }

  /**
   * Obtiene tarjetas de una lista específica
   */
  async getCardsByList(listId: string, userToken: string, userTokenSecret: string): Promise<TrelloCard[]> {
    return this.makeAuthenticatedRequest('GET', `/lists/${listId}/cards`, userToken, userTokenSecret, {
      filter: 'open',
      fields: 'id,name,desc,due,dueComplete,idList,idBoard,idMembers,labels,url,dateLastActivity',
    })
  }

  /**
   * Obtiene información de miembros
   */
  async getMembers(memberIds: string[], userToken: string, userTokenSecret: string): Promise<TrelloMember[]> {
    if (memberIds.length === 0) return []
    
    const members = await Promise.all(
      memberIds.map(id =>
        this.makeAuthenticatedRequest('GET', `/members/${id}`, userToken, userTokenSecret, {
          fields: 'id,username,fullName,email',
        })
      )
    )

    return members
  }
}

export const trelloService = new TrelloService()

