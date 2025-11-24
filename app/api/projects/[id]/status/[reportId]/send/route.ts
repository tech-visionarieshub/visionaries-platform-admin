import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { statusReportsRepository } from '@/lib/repositories/status-reports-repository';

type StatusReportParamsContext = {
  params: Promise<{ id: string; reportId: string }>;
};

/**
 * POST - Enviar status report al cliente
 */
export async function POST(
  request: NextRequest,
  context: StatusReportParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, reportId } = await context.params;
      const body = await request.json();

      const { sentTo, previewUrl } = body;

      if (!sentTo) {
        return NextResponse.json(
          { error: 'sentTo es requerido' },
          { status: 400 }
        );
      }

      // Actualizar reporte con información de envío
      await statusReportsRepository.update(projectId, reportId, {
        status: 'sent',
        sentTo,
        sentAt: new Date(),
        previewUrl: previewUrl || undefined,
      });

      const updatedReport = await statusReportsRepository.getById(projectId, reportId);

      // TODO: Aquí se integraría con el servicio de email (Brevo, etc.)
      // Por ahora solo marcamos como enviado

      return NextResponse.json({
        success: true,
        message: 'Reporte enviado exitosamente',
        report: updatedReport,
      });
    } catch (error: any) {
      console.error('[Status Report Send] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al enviar reporte' },
        { status: 500 }
      );
    }
  });
}

