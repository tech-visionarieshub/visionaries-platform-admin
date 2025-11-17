import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { cotizacionesRepository } from '@/lib/repositories/cotizaciones-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const cotizacion = await cotizacionesRepository.getById(params.id);

      if (!cotizacion) {
        return NextResponse.json(
          { error: 'Cotizacion not found' },
          { status: 404 }
        );
      }

      // Crear proyecto desde cotización
      const projectData = {
        name: cotizacion.titulo,
        client: cotizacion.clienteNombre,
        clientId: cotizacion.clienteId,
        status: 'En desarrollo' as const,
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        responsible: '',
        features: cotizacion.alcance.funcionalidades.length,
        completedFeatures: 0,
        budget: cotizacion.desglose.costoTotal,
        hoursEstimated: cotizacion.desglose.horasTotales,
        hoursWorked: 0,
        description: cotizacion.alcance.descripcion,
        cotizacionId: cotizacion.id,
      };

      const project = await projectsRepository.create(projectData);

      // Actualizar cotización para marcarla como convertida y vincular proyecto
      await cotizacionesRepository.update(params.id, {
        estado: 'Convertida',
        proyectoId: project.id,
      });

      return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
      console.error('[Cotizaciones Convert API] Error:', error);
      return NextResponse.json(
        { error: 'Error converting cotizacion to project', message: error.message },
        { status: 500 }
      );
    }
  });
}

