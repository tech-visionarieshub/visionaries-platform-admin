import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/google-calendar-service';
import { withAuth } from '@/lib/api/middleware';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/projects/[id]/calendar/filter
 * Obtiene el filtro de palabra clave del proyecto
 */
export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const filterKeyword = await googleCalendarService.getCalendarFilter(projectId);

      return NextResponse.json({
        filterKeyword,
      });
    } catch (error: any) {
      console.error('[Calendar Filter API GET] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener filtro' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/projects/[id]/calendar/filter
 * Guarda el filtro de palabra clave del proyecto
 */
export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const body = await request.json();
      const { filterKeyword } = body;

      if (!filterKeyword || typeof filterKeyword !== 'string') {
        return NextResponse.json(
          { error: 'filterKeyword es requerido y debe ser un string' },
          { status: 400 }
        );
      }

      await googleCalendarService.saveCalendarFilter(projectId, filterKeyword.trim());

      return NextResponse.json({
        success: true,
        filterKeyword: filterKeyword.trim(),
        message: 'Filtro guardado exitosamente',
      });
    } catch (error: any) {
      console.error('[Calendar Filter API POST] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al guardar filtro' },
        { status: 500 }
      );
    }
  });
}

