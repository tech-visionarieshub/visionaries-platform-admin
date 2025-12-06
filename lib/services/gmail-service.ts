import { google, gmail_v1 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';

// El email del admin puede ser configurado, por defecto magic@visionarieshub.com
const ADMIN_EMAIL = process.env.GOOGLE_GMAIL_ADMIN_EMAIL || process.env.GOOGLE_CALENDAR_ADMIN_EMAIL || 'magic@visionarieshub.com';
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
];

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  htmlBody?: string;
  fromName?: string; // Nombre del remitente (ej: "TASK Visionaries Suite")
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    contentType?: string;
  }>;
}

export class GmailService {
  private db = getInternalFirestore();
  private configCollection = this.db.collection('config');
  private gmail: gmail_v1.Gmail | null = null;
  private jwtClient: JWT | null = null;

  /**
   * Obtiene las credenciales del Service Account desde Firestore
   * Puede usar las mismas credenciales de Google Calendar o tener su propia configuración
   */
  private async getServiceAccountCredentials(): Promise<any> {
    // Primero intentar obtener credenciales específicas de Gmail
    let doc = await this.configCollection.doc('gmail').get();
    
    if (doc.exists && doc.data()?.serviceAccountJson) {
      const data = doc.data();
      if (typeof data.serviceAccountJson === 'string') {
        try {
          return JSON.parse(data.serviceAccountJson);
        } catch (e) {
          // Continuar para usar Google Calendar como fallback
        }
      } else {
        return data.serviceAccountJson;
      }
    }

    // Fallback: usar las credenciales de Google Calendar
    doc = await this.configCollection.doc('googleCalendar').get();
    
    if (!doc.exists) {
      throw new Error('Gmail Service Account no está configurado. Ve a Settings para configurarlo o usa las credenciales de Google Calendar.');
    }

    const data = doc.data();
    if (!data?.serviceAccountJson) {
      throw new Error('Gmail Service Account no está configurado. Ve a Settings para configurarlo o usa las credenciales de Google Calendar.');
    }

    // Si es string, parsearlo
    if (typeof data.serviceAccountJson === 'string') {
      try {
        return JSON.parse(data.serviceAccountJson);
      } catch (e) {
        throw new Error('Service Account JSON inválido. Por favor verifica la configuración.');
      }
    }

    // Si ya es un objeto, retornarlo directamente
    return data.serviceAccountJson;
  }

  /**
   * Obtiene un cliente autenticado de Gmail
   */
  private async getGmailClient(): Promise<gmail_v1.Gmail> {
    if (this.gmail && this.jwtClient) {
      // Verificar que el token no haya expirado
      const credentials = this.jwtClient.credentials;
      if (credentials.expiry_date && credentials.expiry_date > Date.now()) {
        return this.gmail;
      }
      // Si expiró, refrescar
      this.jwtClient = null;
      this.gmail = null;
    }

    try {
      const credentials = await this.getServiceAccountCredentials();
      
      // Crear JWT client con domain-wide delegation
      this.jwtClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: GMAIL_SCOPES,
        subject: ADMIN_EMAIL, // Impersonar al usuario admin
      });

      // Obtener token explícitamente antes de usar el cliente
      // Esto es necesario para domain-wide delegation
      await this.jwtClient.authorize();

      this.gmail = google.gmail({
        version: 'v1',
        auth: this.jwtClient,
      });

      return this.gmail;
    } catch (error: any) {
      // Mejorar mensaje de error
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('unauthorized_client')) {
        // Obtener el Client ID del Service Account para mostrar en el error
        let clientId = 'del Service Account configurado'
        try {
          const credentials = await this.getServiceAccountCredentials()
          clientId = credentials.client_id || 'del Service Account configurado'
        } catch (e) {
          // Si no se puede obtener, usar el Client ID conocido de Gmail
          clientId = '114317182996525369700'
        }
        
        errorMessage = `Error de autenticación. Verifica que:
1. Domain-wide delegation esté configurado en Google Workspace Admin Console
2. El Client ID ${clientId} esté autorizado
3. Los scopes https://www.googleapis.com/auth/gmail.send y https://www.googleapis.com/auth/gmail.compose estén autorizados
4. El usuario ${ADMIN_EMAIL} exista en el dominio`;
      }
      
      throw new Error(
        `Error autenticando con Gmail: ${errorMessage}`
      );
    }
  }

  /**
   * Verifica la conexión con Gmail
   */
  async verifyConnection(): Promise<{ connected: boolean; email?: string; error?: string }> {
    try {
      // Obtener el JWT client y forzar que tenga el token
      if (!this.jwtClient) {
        const credentials = await this.getServiceAccountCredentials();
        this.jwtClient = new JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: GMAIL_SCOPES,
          subject: ADMIN_EMAIL,
        });
      }
      
      // Asegurar que el token esté actualizado
      const credentials = this.jwtClient.credentials;
      if (!credentials.access_token || (credentials.expiry_date && credentials.expiry_date <= Date.now())) {
        await this.jwtClient.authorize();
      }
      
      // Usar fetch directamente con el token para verificar
      const token = this.jwtClient.credentials.access_token;
      if (!token) {
        throw new Error('No se pudo obtener el token de acceso');
      }
      
      // Obtener perfil del usuario para verificar conexión
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const profile = await response.json();
      
      // Crear el cliente de gmail para uso futuro
      this.gmail = google.gmail({
        version: 'v1',
        auth: this.jwtClient,
      });

      return {
        connected: true,
        email: profile.emailAddress,
      };
    } catch (error: any) {
      let errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Mejorar mensajes de error específicos
      // Obtener el Client ID del Service Account para mostrar en el error
      let clientId = '114317182996525369700' // Client ID por defecto de Gmail
      try {
        const credentials = await this.getServiceAccountCredentials()
        clientId = credentials.client_id || clientId
      } catch (e) {
        // Usar el Client ID por defecto si no se puede obtener
      }
      
      if (error.code === 401 || errorMessage.includes('Login Required') || errorMessage.includes('UNAUTHENTICATED')) {
        errorMessage = `Error de autenticación. Verifica:
1. Domain-wide delegation está configurado en Google Workspace Admin Console
2. Client ID ${clientId} está autorizado
3. Scopes: https://www.googleapis.com/auth/gmail.send y https://www.googleapis.com/auth/gmail.compose están autorizados
4. El usuario ${ADMIN_EMAIL} existe en el dominio
5. Espera unos minutos después de configurar Domain-wide delegation para que se propague`;
      } else if (error.code === 403) {
        errorMessage = `No tienes permisos para acceder a Gmail. Verifica que el Service Account (Client ID: ${clientId}) tenga domain-wide delegation configurado correctamente con los scopes de Gmail.`;
      } else if (errorMessage.includes('invalid_grant')) {
        errorMessage = `Error de autenticación. Verifica que el usuario ${ADMIN_EMAIL} exista y que domain-wide delegation esté configurado con los scopes de Gmail para el Client ID ${clientId}.`;
      }
      
      console.error('[GmailService] Error verificando conexión:', error);
      
      return {
        connected: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Obtiene el token de acceso actualizado
   */
  private async getAccessToken(): Promise<string> {
    if (!this.jwtClient) {
      const credentials = await this.getServiceAccountCredentials();
      this.jwtClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: GMAIL_SCOPES,
        subject: ADMIN_EMAIL,
      });
    }
    
    // Verificar si el token está expirado
    const credentials = this.jwtClient.credentials;
    if (!credentials.access_token || (credentials.expiry_date && credentials.expiry_date <= Date.now())) {
      await this.jwtClient.authorize();
    }
    
    if (!this.jwtClient.credentials.access_token) {
      throw new Error('No se pudo obtener el token de acceso');
    }
    
    return this.jwtClient.credentials.access_token;
  }

  /**
   * Crea un mensaje de email en formato RFC 2822
   */
  private createEmailMessage(message: EmailMessage): string {
    const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    const cc = message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : '';
    const bcc = message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : '';
    
    // Construir el header From con nombre si está disponible
    const fromName = message.fromName || 'Visionaries Hub';
    const fromHeader = `From: ${fromName} <${ADMIN_EMAIL}>`;
    
    const headers = [
      fromHeader,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      bcc ? `Bcc: ${bcc}` : '',
      `Subject: ${message.subject}`,
      'MIME-Version: 1.0',
    ].filter(Boolean);

    let body = '';
    if (message.htmlBody) {
      headers.push('Content-Type: text/html; charset=utf-8');
      body = message.htmlBody;
    } else {
      headers.push('Content-Type: text/plain; charset=utf-8');
      body = message.body;
    }

    // Si hay attachments, crear multipart message
    if (message.attachments && message.attachments.length > 0) {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      
      let multipartBody = `\n--${boundary}\n`;
      multipartBody += `Content-Type: text/${message.htmlBody ? 'html' : 'plain'}; charset=utf-8\n`;
      multipartBody += `Content-Transfer-Encoding: 7bit\n\n`;
      multipartBody += body;
      
      for (const attachment of message.attachments) {
        multipartBody += `\n--${boundary}\n`;
        multipartBody += `Content-Type: ${attachment.contentType || 'application/octet-stream'}\n`;
        multipartBody += `Content-Disposition: attachment; filename="${attachment.filename}"\n`;
        multipartBody += `Content-Transfer-Encoding: base64\n\n`;
        multipartBody += attachment.content;
      }
      
      multipartBody += `\n--${boundary}--\n`;
      body = multipartBody;
    }

    return `${headers.join('\n')}\n\n${body}`;
  }

  /**
   * Envía un email usando Gmail API
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();
      
      // Crear el mensaje en formato RFC 2822
      const rawMessage = this.createEmailMessage(message);
      
      // Codificar en base64url (no base64 estándar)
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      console.log('[GmailService] Enviando email:', {
        to: message.to,
        subject: message.subject,
        hasAttachments: !!(message.attachments && message.attachments.length > 0),
      });

      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[GmailService] Error enviando email:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error?.message || `Error al enviar email: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[GmailService] Email enviado exitosamente:', {
        id: result.id,
        threadId: result.threadId,
      });
      
      return {
        success: true,
        messageId: result.id,
      };
    } catch (error: any) {
      console.error('[GmailService] Error enviando email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Envía un email con template HTML simple
   */
  async sendEmailWithTemplate(
    to: string | string[],
    subject: string,
    template: string,
    variables: Record<string, string> = {},
    options?: {
      cc?: string | string[];
      bcc?: string | string[];
      attachments?: Array<{
        filename: string;
        content: string;
        contentType?: string;
      }>;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Reemplazar variables en el template
    let htmlBody = template;
    for (const [key, value] of Object.entries(variables)) {
      htmlBody = htmlBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.sendEmail({
      to,
      cc: options?.cc,
      bcc: options?.bcc,
      subject,
      body: htmlBody.replace(/<[^>]*>/g, ''), // Plain text fallback
      htmlBody,
      attachments: options?.attachments,
    });
  }
}

export const gmailService = new GmailService();


