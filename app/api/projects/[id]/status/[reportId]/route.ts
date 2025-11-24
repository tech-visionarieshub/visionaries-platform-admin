import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { statusReportsRepository } from '@/lib/repositories/status-reports-repository';

type StatusReportParamsContext = {
  params: Promise<{ id: string; reportId: string }>;
};

/**
 * GET - Obtener un status report específico
 */
export async function GET(
  request: NextRequest,
  context: StatusReportParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, reportId } = await context.params;
      const report = await statusReportsRepository.getById(projectId, reportId);

      if (!report) {
        return NextResponse.json(
          { error: 'Reporte no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        report,
      });
    } catch (error: any) {
      console.error('[Status Report GET] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener reporte' },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT - Actualizar un status report
 */
export async function PUT(
  request: NextRequest,
  context: StatusReportParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, reportId } = await context.params;
      const body = await request.json();

      const { subject, content, status, previewUrl, sentAt } = body;

      const updates: any = {};
      if (subject !== undefined) updates.subject = subject;
      if (content !== undefined) updates.content = content;
      if (status !== undefined) updates.status = status;
      if (previewUrl !== undefined) updates.previewUrl = previewUrl;
      if (sentAt !== undefined) updates.sentAt = sentAt ? new Date(sentAt) : undefined;

      await statusReportsRepository.update(projectId, reportId, updates);

      const updatedReport = await statusReportsRepository.getById(projectId, reportId);

      return NextResponse.json({
        success: true,
        report: updatedReport,
      });
    } catch (error: any) {
      console.error('[Status Report PUT] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al actualizar reporte' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE - Eliminar un status report (solo drafts)
 */
export async function DELETE(
  request: NextRequest,
  context: StatusReportParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, reportId } = await context.params;
      
      // Verificar que el reporte existe y es un draft
      const report = await statusReportsRepository.getById(projectId, reportId);
      if (!report) {
        return NextResponse.json(
          { error: 'Reporte no encontrado' },
          { status: 404 }
        );
      }

      // No permitir borrar reportes enviados
      if (report.status === 'sent') {
        return NextResponse.json(
          { error: 'No se pueden borrar reportes enviados' },
          { status: 400 }
        );
      }

      await statusReportsRepository.delete(projectId, reportId);

      return NextResponse.json({
        success: true,
        message: 'Draft eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('[Status Report DELETE] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al eliminar reporte' },
        { status: 500 }
      );
    }
  });
}

