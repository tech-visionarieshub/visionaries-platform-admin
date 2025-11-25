import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/google-calendar-service';
import { withAuth } from '@/lib/api/middleware';
import { projectsRepository } from '@/lib/repositories/projects-repository';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/calendar
 * Obtiene el estado de conexión y eventos sincronizados
 */
export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;

      // Verificar conexión con Google Calendar
      const connectionStatus = await googleCalendarService.verifyConnection();
      
      if (!connectionStatus.connected) {
        return NextResponse.json({
          connected: false,
          error: connectionStatus.error,
          events: [],
          syncedEvents: [],
        });
      }

      // Obtener información del proyecto para calcular rango de fechas
      const project = await projectsRepository.getById(projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }

      // Obtener eventos sincronizados del proyecto
      const syncedEvents = await googleCalendarService.getSyncedEvents(projectId);

      // Calcular rango de fechas: desde inicio del proyecto hasta 1 año en el futuro
      let timeMin: string;
      let timeMax: string;

      if (project.startDate) {
        const startDate = new Date(project.startDate);
        timeMin = startDate.toISOString();
      } else {
        // Si no hay fecha de inicio, usar fecha actual
        timeMin = new Date().toISOString();
      }

      // 1 año en el futuro desde hoy
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      timeMax = oneYearFromNow.toISOString();

      // Obtener eventos de Google Calendar (desde inicio del proyecto hasta 1 año en el futuro)
      // Aumentar maxResults para obtener más eventos
      console.log('[Calendar API] Obteniendo eventos desde:', timeMin, 'hasta:', timeMax);
      const googleEvents = await googleCalendarService.listEvents(timeMin, timeMax, 250);
      console.log('[Calendar API] Eventos obtenidos de Google Calendar:', googleEvents.length);

      // Obtener filtro de palabra clave del proyecto
      const filterKeyword = await googleCalendarService.getCalendarFilter(projectId);

      // Mapear eventos de Google Calendar a formato simplificado
      let events = googleEvents.map(event => ({
        id: event.id,
        title: event.summary || 'Sin título',
        description: event.description || '',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        attendees: event.attendees?.map(a => a.email || '') || [],
        location: event.location || '',
        htmlLink: event.htmlLink || '',
        status: event.status,
      }));

      // Filtrar eventos por palabra clave si está configurada
      if (filterKeyword) {
        const keywordLower = filterKeyword.toLowerCase();
        events = events.filter(event => 
          event.title.toLowerCase().includes(keywordLower) ||
          event.description.toLowerCase().includes(keywordLower)
        );
      }

      // Ordenar eventos del más reciente al más viejo (por fecha de inicio descendente)
      events.sort((a, b) => {
        const dateA = new Date(a.start).getTime();
        const dateB = new Date(b.start).getTime();
        return dateB - dateA; // Descendente: más reciente primero
      });

      return NextResponse.json({
        connected: true,
        calendarId: connectionStatus.calendarId,
        events,
        filterKeyword,
        syncedEvents: syncedEvents.map(se => ({
          id: se.id,
          projectEventId: se.projectEventId,
          googleEventId: se.googleEventId,
          title: se.title,
          type: se.type,
          syncedAt: se.syncedAt.toISOString(),
          updatedAt: se.updatedAt.toISOString(),
        })),
      });
    } catch (error: any) {
      console.error('[Calendar Project API GET] Error:', error);
      return NextResponse.json(
        { 
          connected: false,
          error: error.message || 'Error al obtener datos del calendario',
          events: [],
          syncedEvents: [],
        },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/projects/[id]/calendar/events
 * Crea un evento manual en Google Calendar
 */
export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const body = await request.json();

      const { title, description, start, end, attendees, location, type } = body;

      // Validaciones
      if (!title || typeof title !== 'string') {
        return NextResponse.json(
          { error: 'title es requerido y debe ser un string' },
          { status: 400 }
        );
      }

      if (!start) {
        return NextResponse.json(
          { error: 'start es requerido' },
          { status: 400 }
        );
      }

      if (!end) {
        return NextResponse.json(
          { error: 'end es requerido' },
          { status: 400 }
        );
      }

      console.log('[Calendar API POST] Creando evento:', { 
        title, 
        start, 
        end, 
        location, 
        attendees: attendees.length 
      });
      
      // Crear evento en Google Calendar
      // Las fechas vienen en ISO string desde el frontend
      // Necesitamos mantener la fecha/hora exacta pero especificar el timezone correcto
      let startObj, endObj;
      
      if (typeof start === 'string') {
        // La fecha viene como ISO string, pero la interpretamos como hora local de México
        // Convertir a formato RFC3339 sin 'Z' y especificar timezone
        const startDate = new Date(start);
        // Formatear como YYYY-MM-DDTHH:mm:ss (sin timezone indicator)
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const hours = String(startDate.getHours()).padStart(2, '0');
        const mins = String(startDate.getMinutes()).padStart(2, '0');
        const secs = String(startDate.getSeconds()).padStart(2, '0');
        const dateTimeStr = `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
        startObj = { dateTime: dateTimeStr, timeZone: 'America/Mexico_City' };
      } else {
        startObj = { ...start, timeZone: start.timeZone || 'America/Mexico_City' };
      }
      
      if (typeof end === 'string') {
        const endDate = new Date(end);
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const hours = String(endDate.getHours()).padStart(2, '0');
        const mins = String(endDate.getMinutes()).padStart(2, '0');
        const secs = String(endDate.getSeconds()).padStart(2, '0');
        const dateTimeStr = `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
        endObj = { dateTime: dateTimeStr, timeZone: 'America/Mexico_City' };
      } else {
        endObj = { ...end, timeZone: end.timeZone || 'America/Mexico_City' };
      }
      
      console.log('[Calendar API POST] Fechas formateadas:', {
        startOriginal: start,
        startFormatted: startObj,
        endOriginal: end,
        endFormatted: endObj,
      });

      const googleEvent = await googleCalendarService.createEvent({
        title,
        description: description || '',
        start: startObj,
        end: endObj,
        attendees: attendees?.map((email: string) => ({ email })) || [],
        location: location || '',
      });

      console.log('[Calendar API POST] Evento creado en Google Calendar:', googleEvent.id, googleEvent.summary);

      // Guardar mapeo en Firestore
      const projectEventId = `manual_${Date.now()}`;
      await googleCalendarService.saveSyncedEvent(projectId, {
        id: `${projectId}_${projectEventId}`,
        projectEventId,
        googleEventId: googleEvent.id || '',
        title,
        type: type || 'meeting',
        syncedAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('[Calendar API POST] Evento guardado en Firestore:', projectEventId);

      return NextResponse.json({
        success: true,
        event: {
          id: googleEvent.id,
          title: googleEvent.summary,
          start: googleEvent.start?.dateTime || googleEvent.start?.date,
          end: googleEvent.end?.dateTime || googleEvent.end?.date,
          htmlLink: googleEvent.htmlLink,
        },
      });
    } catch (error: any) {
      console.error('[Calendar Project API POST] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al crear evento' },
        { status: 500 }
      );
    }
  });
}

