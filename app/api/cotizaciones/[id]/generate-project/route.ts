import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { cotizacionesRepository } from '@/lib/repositories/cotizaciones-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { OpenAIService } from '@/lib/services/openai-service';
import { getAuraAuth } from '@/lib/firebase/admin-tech';

type IdParamsContext = { params: Promise<{ id: string }> };

/**
 * Genera un proyecto completo desde una cotización usando IA
 * - Genera descripción detallada del proyecto
 * - Crea features automáticamente desde las funcionalidades de la cotización
 * - Estima horas y prioridades con IA
 */
export async function POST(
  request: NextRequest,
  context: IdParamsContext
) {
  const { id } = await context.params;

  return withAuth(request, async (user) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { name, description, startDate: providedStartDate, responsible: providedResponsible } = body;

      const cotizacion = await cotizacionesRepository.getById(id);

      if (!cotizacion) {
        return NextResponse.json(
          { error: 'Cotización no encontrada' },
          { status: 404 }
        );
      }

      // Verificar si ya tiene proyecto asociado
      if (cotizacion.proyectoId) {
        return NextResponse.json(
          { error: 'Esta cotización ya tiene un proyecto asociado' },
          { status: 400 }
        );
      }

      const openAIService = new OpenAIService();
      const auth = getAuraAuth();

      // Obtener información del usuario creador
      let responsibleName = providedResponsible || user.name || 'Sin asignar';
      if (!providedResponsible && user.email) {
        try {
          const creatorUser = await auth.getUserByEmail(user.email);
          responsibleName = creatorUser.displayName || creatorUser.email?.split('@')[0] || user.email;
        } catch (authError) {
          // Si no se puede obtener, usar el nombre del usuario actual
          responsibleName = user.name || user.email?.split('@')[0] || 'Sin asignar';
        }
      }

      // Calcular fecha de fin basada en los meses estimados
      const startDate = providedStartDate ? new Date(providedStartDate) : new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (cotizacion.desglose?.meses || 6));

      // Generar descripción detallada del proyecto con IA (solo si no se proporcionó una)
      console.log('[Generate Project] Generando descripción del proyecto con IA...');
      const projectDescription = description || await openAIService.generateProjectDescription({
        titulo: cotizacion.titulo,
        tipoProyecto: cotizacion.tipoProyecto,
        descripcionAlcance: cotizacion.alcance?.descripcion || '',
        funcionalidades: cotizacion.alcance?.funcionalidades || [],
        pantallas: cotizacion.alcance?.pantallas || [],
        cliente: cotizacion.clienteNombre,
      });

      // Crear el proyecto
      const projectData = {
        name: name || cotizacion.titulo,
        client: cotizacion.clienteNombre,
        clientId: cotizacion.clienteId,
        status: 'En ejecución' as const,
        progress: 0,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        responsible: responsibleName,
        features: 0, // Se actualizará después de crear las features
        completedFeatures: 0,
        budget: cotizacion.desglose?.costoTotal || 0,
        hoursEstimated: cotizacion.desglose?.horasTotales || 0,
        hoursWorked: 0,
        description: projectDescription,
        cotizacionId: cotizacion.id,
        createdBy: user.email || user.id || 'unknown',
      };

      const project = await projectsRepository.create(projectData);
      console.log('[Generate Project] Proyecto creado:', project.id);

      // Generar features desde las funcionalidades de la cotización
      if (cotizacion.alcance?.funcionalidades && cotizacion.alcance.funcionalidades.length > 0) {
        console.log(`[Generate Project] Generando ${cotizacion.alcance.funcionalidades.length} features con IA...`);
        
        const featuresToCreate = await openAIService.generateFeaturesFromCotizacion({
          projectName: cotizacion.titulo,
          funcionalidades: cotizacion.alcance.funcionalidades,
          pantallas: cotizacion.alcance.pantallas || [],
          horasTotales: cotizacion.desglose?.horasTotales || 0,
        });

        // Crear features en batch
        if (featuresToCreate.length > 0) {
          const createdFeatures = await featuresRepository.createBatch(
            project.id,
            featuresToCreate.map(f => ({
              ...f,
              createdBy: user.email || user.id || 'unknown',
            })),
            project.name
          );

          console.log(`[Generate Project] ${createdFeatures.length} features creadas`);

          // Actualizar el proyecto con el número de features
          await projectsRepository.update(project.id, {
            features: createdFeatures.length,
          });
        }
      }

      // Actualizar cotización para marcarla como convertida y vincular proyecto
      await cotizacionesRepository.update(id, {
        estado: 'Convertida',
        proyectoId: project.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          project,
          message: `Proyecto creado exitosamente con ${cotizacion.alcance?.funcionalidades?.length || 0} funcionalidades`,
        },
      }, { status: 201 });
    } catch (error: any) {
      console.error('[Generate Project] Error:', error);
      return NextResponse.json(
        { error: 'Error generando proyecto desde cotización', message: error.message },
        { status: 500 }
      );
    }
  });
}

