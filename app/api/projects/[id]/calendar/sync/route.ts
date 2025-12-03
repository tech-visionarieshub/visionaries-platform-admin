import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/google-calendar-service';
import { withAuth } from '@/lib/api/middleware';
import { calendarSyncService } from '@/lib/services/calendar-sync-service';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/projects/[id]/calendar/sync
 * Sincroniza eventos del proyecto con Google Calendar
 */
export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;

      // Verificar conexión
      const connectionStatus = await googleCalendarService.verifyConnection();
      if (!connectionStatus.connected) {
        return NextResponse.json(
          { error: connectionStatus.error || 'No hay conexión con Google Calendar' },
          { status: 400 }
        );
      }

      // Obtener eventos del proyecto que deben sincronizarse
      const projectEvents = await calendarSyncService.extractProjectEvents(projectId);

      // Obtener eventos ya sincronizados
      const existingSyncedEvents = await googleCalendarService.getSyncedEvents(projectId);
      const syncedMap = new Map(
        existingSyncedEvents.map(se => [se.projectEventId, se])
      );

      const results = {
        created: 0,
        updated: 0,
        errors: [] as string[],
      };

      // Sincronizar cada evento
      for (const projectEvent of projectEvents) {
        try {
          const existing = syncedMap.get(projectEvent.id);

          if (existing) {
            // Actualizar evento existente
            await googleCalendarService.updateEvent(
              existing.googleEventId,
              projectEvent.calendarEvent
            );
            
            // Actualizar mapeo
            await googleCalendarService.saveSyncedEvent(projectId, {
              ...existing,
              title: projectEvent.calendarEvent.title,
              updatedAt: new Date(),
            });
            
            results.updated++;
          } else {
            // Crear nuevo evento
            const googleEvent = await googleCalendarService.createEvent(projectEvent.calendarEvent);
            
            // Guardar mapeo
            await googleCalendarService.saveSyncedEvent(projectId, {
              id: `${projectId}_${projectEvent.id}`,
              projectEventId: projectEvent.id,
              googleEventId: googleEvent.id || '',
              title: projectEvent.calendarEvent.title,
              type: projectEvent.type,
              syncedAt: new Date(),
              updatedAt: new Date(),
            });
            
            results.created++;
          }
        } catch (error: any) {
          results.errors.push(`Error sincronizando ${projectEvent.id}: ${error.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Sincronización completada: ${results.created} creados, ${results.updated} actualizados`,
      });
    } catch (error: any) {
      console.error('[Calendar Sync API] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al sincronizar eventos' },
        { status: 500 }
      );
    }
  });
}












