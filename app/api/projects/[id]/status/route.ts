import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { statusReportsRepository } from '@/lib/repositories/status-reports-repository';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET - Obtener historial de status reports
 */
export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const reports = await statusReportsRepository.getAll(projectId);

      return NextResponse.json({
        success: true,
        reports,
      });
    } catch (error: any) {
      console.error('[Status Reports GET] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener reportes' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST - Crear nuevo status report (draft)
 */
export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const body = await request.json();

      const { subject, content, weekStartDate, weekEndDate } = body;

      if (!subject || !content) {
        return NextResponse.json(
          { error: 'subject y content son requeridos' },
          { status: 400 }
        );
      }

      const report = await statusReportsRepository.create(projectId, {
        projectId,
        subject,
        content,
        weekStartDate: weekStartDate ? new Date(weekStartDate) : new Date(),
        weekEndDate: weekEndDate ? new Date(weekEndDate) : new Date(),
        status: 'draft',
        createdBy: user.email || user.uid,
      });

      return NextResponse.json({
        success: true,
        report,
      });
    } catch (error: any) {
      console.error('[Status Reports POST] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al crear reporte' },
        { status: 500 }
      );
    }
  });
}

