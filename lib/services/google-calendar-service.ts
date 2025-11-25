import { google, calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';

// El email del admin puede ser configurado, por defecto magic@visionarieshub.com
const ADMIN_EMAIL = process.env.GOOGLE_CALENDAR_ADMIN_EMAIL || 'magic@visionarieshub.com';
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  location?: string;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
}

export interface SyncedEvent {
  id: string;
  projectEventId: string;
  googleEventId: string;
  title: string;
  type: 'milestone' | 'deadline' | 'meeting' | 'review' | 'warranty';
  syncedAt: Date;
  updatedAt: Date;
}

export class GoogleCalendarService {
  private db = getInternalFirestore();
  private configCollection = this.db.collection('config');
  private calendar: calendar_v3.Calendar | null = null;
  private jwtClient: JWT | null = null;

  /**
   * Obtiene las credenciales del Service Account desde Firestore
   */
  private async getServiceAccountCredentials(): Promise<any> {
    const doc = await this.configCollection.doc('googleCalendar').get();
    
    if (!doc.exists) {
      throw new Error('Google Calendar Service Account no está configurado. Ve a Settings para configurarlo.');
    }

    const data = doc.data();
    if (!data?.serviceAccountJson) {
      throw new Error('Google Calendar Service Account no está configurado. Ve a Settings para configurarlo.');
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
   * Obtiene un cliente autenticado de Google Calendar
   */
  private async getCalendarClient(): Promise<calendar_v3.Calendar> {
    if (this.calendar && this.jwtClient) {
      // Verificar que el token no haya expirado
      const credentials = this.jwtClient.credentials;
      if (credentials.expiry_date && credentials.expiry_date > Date.now()) {
        return this.calendar;
      }
      // Si expiró, refrescar
      this.jwtClient = null;
      this.calendar = null;
    }

    try {
      const credentials = await this.getServiceAccountCredentials();
      
      // Crear JWT client con domain-wide delegation
      this.jwtClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: CALENDAR_SCOPES,
        subject: ADMIN_EMAIL, // Impersonar al usuario admin
      });

      // Obtener token explícitamente antes de usar el cliente
      // Esto es necesario para domain-wide delegation
      await this.jwtClient.authorize();

      this.calendar = google.calendar({
        version: 'v3',
        auth: this.jwtClient,
      });

      return this.calendar;
    } catch (error: any) {
      // Mejorar mensaje de error
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('unauthorized_client')) {
        errorMessage = `Error de autenticación. Verifica que:
1. Domain-wide delegation esté configurado en Google Workspace Admin Console
2. El Client ID 110617753637691984482 esté autorizado
3. El scope https://www.googleapis.com/auth/calendar esté autorizado
4. El usuario ${ADMIN_EMAIL} exista en el dominio`;
      }
      
      throw new Error(
        `Error autenticando con Google Calendar: ${errorMessage}`
      );
    }
  }

  /**
   * Verifica la conexión con Google Calendar
   */
  async verifyConnection(): Promise<{ connected: boolean; calendarId?: string; error?: string }> {
    try {
      // Obtener el JWT client y forzar que tenga el token
      if (!this.jwtClient) {
        const credentials = await this.getServiceAccountCredentials();
        this.jwtClient = new JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: CALENDAR_SCOPES,
          subject: ADMIN_EMAIL,
        });
      }
      
      // Asegurar que el token esté actualizado
      const credentials = this.jwtClient.credentials;
      if (!credentials.access_token || (credentials.expiry_date && credentials.expiry_date <= Date.now())) {
        await this.jwtClient.authorize();
      }
      
      // Usar fetch directamente con el token para evitar problemas con googleapis
      const token = this.jwtClient.credentials.access_token;
      if (!token) {
        throw new Error('No se pudo obtener el token de acceso');
      }
      
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
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
      
      const calendarList = await response.json();
      const primaryCalendar = calendarList.items?.find((cal: any) => cal.primary) || calendarList.items?.[0];
      
      if (!primaryCalendar?.id) {
        return { connected: false, error: 'No se encontró calendario principal' };
      }

      // Crear el cliente de calendar para uso futuro
      this.calendar = google.calendar({
        version: 'v3',
        auth: this.jwtClient,
      });

      return {
        connected: true,
        calendarId: primaryCalendar.id,
      };
    } catch (error: any) {
      let errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Mejorar mensajes de error específicos
      if (error.code === 401 || errorMessage.includes('Login Required') || errorMessage.includes('UNAUTHENTICATED')) {
        errorMessage = `Error de autenticación. Verifica:
1. Domain-wide delegation está configurado en Google Workspace Admin Console
2. Client ID: 110617753637691984482 está autorizado
3. Scope: https://www.googleapis.com/auth/calendar está autorizado
4. El usuario ${ADMIN_EMAIL} existe en el dominio
5. Espera unos minutos después de configurar Domain-wide delegation para que se propague`;
      } else if (error.code === 403) {
        errorMessage = 'No tienes permisos para acceder al calendario. Verifica que el Service Account tenga domain-wide delegation configurado correctamente.';
      } else if (errorMessage.includes('invalid_grant')) {
        errorMessage = `Error de autenticación. Verifica que el usuario ${ADMIN_EMAIL} exista y que domain-wide delegation esté configurado.`;
      }
      
      console.error('[GoogleCalendarService] Error verificando conexión:', error);
      
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
        scopes: CALENDAR_SCOPES,
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
   * Obtiene el ID del calendario principal
   */
  private async getPrimaryCalendarId(): Promise<string> {
    const token = await this.getAccessToken();
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error obteniendo calendarios: ${response.status} ${response.statusText}`);
    }
    
    const calendarList = await response.json();
    const primaryCalendar = calendarList.items?.find((cal: any) => cal.primary) || calendarList.items?.[0];
    
    if (!primaryCalendar?.id) {
      throw new Error('No se encontró calendario principal');
    }

    return primaryCalendar.id;
  }

  /**
   * Crea un evento en Google Calendar
   */
  async createEvent(event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    const token = await this.getAccessToken();
    const calendarId = await this.getPrimaryCalendarId();

    // Asegurar que magic@visionarieshub.com esté en los asistentes
    const attendees = event.attendees || [];
    const hasAdmin = attendees.some(att => att.email === ADMIN_EMAIL);
    if (!hasAdmin) {
      attendees.push({ email: ADMIN_EMAIL });
    }

    // Asegurar que las fechas tengan timezone si no lo tienen
    const startWithTimezone = {
      ...event.start,
      timeZone: event.start.timeZone || 'America/Mexico_City',
    };
    const endWithTimezone = {
      ...event.end,
      timeZone: event.end.timeZone || 'America/Mexico_City',
    };

    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      start: startWithTimezone,
      end: endWithTimezone,
      attendees: attendees,
      location: event.location,
      reminders: event.reminders || {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 horas antes
          { method: 'popup', minutes: 15 }, // 15 minutos antes
        ],
      },
    };

    console.log('[GoogleCalendarService] Creando evento:', {
      calendarId,
      summary: googleEvent.summary,
      start: googleEvent.start,
      end: googleEvent.end,
      location: googleEvent.location,
      attendees: googleEvent.attendees?.length || 0,
    });

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GoogleCalendarService] Error creando evento:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorData.error?.message || `Error al crear evento: ${response.status} ${response.statusText}`);
    }

    const createdEvent = await response.json();
    console.log('[GoogleCalendarService] Evento creado exitosamente:', {
      id: createdEvent.id,
      summary: createdEvent.summary,
      htmlLink: createdEvent.htmlLink,
    });
    
    if (!createdEvent.id) {
      throw new Error('Error al crear evento: no se recibió ID del evento');
    }

    return createdEvent;
  }

  /**
   * Actualiza un evento existente en Google Calendar
   */
  async updateEvent(eventId: string, event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    const token = await this.getAccessToken();
    const calendarId = await this.getPrimaryCalendarId();

    // Asegurar que magic@visionarieshub.com esté en los asistentes
    const attendees = event.attendees || [];
    const hasAdmin = attendees.some(att => att.email === ADMIN_EMAIL);
    if (!hasAdmin) {
      attendees.push({ email: ADMIN_EMAIL });
    }

    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      attendees: attendees,
      location: event.location,
      reminders: event.reminders,
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error al actualizar evento: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Elimina un evento de Google Calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    const token = await this.getAccessToken();
    const calendarId = await this.getPrimaryCalendarId();

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error al eliminar evento: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Lista eventos de Google Calendar en un rango de fechas
   */
  async listEvents(
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 50
  ): Promise<calendar_v3.Schema$Event[]> {
    const token = await this.getAccessToken();
    const calendarId = await this.getPrimaryCalendarId();

    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime', // Ordenamos en el API, pero luego lo invertimos en la ruta
    });
    
    if (timeMax) {
      params.append('timeMax', timeMax);
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error al listar eventos: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Obtiene un evento específico por ID
   */
  async getEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const token = await this.getAccessToken();
      const calendarId = await this.getPrimaryCalendarId();

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Error al obtener evento: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Guarda el mapeo de evento sincronizado en Firestore
   */
  async saveSyncedEvent(projectId: string, syncedEvent: SyncedEvent): Promise<void> {
    await this.db
      .collection('projects')
      .doc(projectId)
      .collection('calendarEvents')
      .doc(syncedEvent.projectEventId)
      .set({
        ...syncedEvent,
        syncedAt: syncedEvent.syncedAt.toISOString(),
        updatedAt: syncedEvent.updatedAt.toISOString(),
      });
  }

  /**
   * Obtiene eventos sincronizados de un proyecto
   */
  async getSyncedEvents(projectId: string): Promise<SyncedEvent[]> {
    const snapshot = await this.db
      .collection('projects')
      .doc(projectId)
      .collection('calendarEvents')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        syncedAt: new Date(data.syncedAt),
        updatedAt: new Date(data.updatedAt),
      } as SyncedEvent;
    });
  }

  /**
   * Elimina el mapeo de evento sincronizado
   */
  async deleteSyncedEvent(projectId: string, projectEventId: string): Promise<void> {
    await this.db
      .collection('projects')
      .doc(projectId)
      .collection('calendarEvents')
      .doc(projectEventId)
      .delete();
  }

  /**
   * Guarda el filtro de palabra clave para el proyecto
   */
  async saveCalendarFilter(projectId: string, filterKeyword: string | null): Promise<void> {
    if (filterKeyword === null || filterKeyword === '') {
      // Remover el filtro
      await this.db
        .collection('projects')
        .doc(projectId)
        .update({
          calendarFilterKeyword: null,
          calendarFilterUpdatedAt: new Date(),
        });
    } else {
      // Guardar el filtro
      await this.db
        .collection('projects')
        .doc(projectId)
        .set({
          calendarFilterKeyword: filterKeyword,
          calendarFilterUpdatedAt: new Date(),
        }, { merge: true });
    }
  }

  /**
   * Obtiene el filtro de palabra clave del proyecto
   */
  async getCalendarFilter(projectId: string): Promise<string | null> {
    const projectDoc = await this.db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return null;
    }
    const data = projectDoc.data();
    return data?.calendarFilterKeyword || null;
  }
}

export const googleCalendarService = new GoogleCalendarService();

