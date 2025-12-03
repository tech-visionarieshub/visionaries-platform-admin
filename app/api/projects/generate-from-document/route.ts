import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { OpenAIService } from '@/lib/services/openai-service';
import { getAuraAuth } from '@/lib/firebase/admin-tech';

/**
 * Genera un proyecto completo desde el contenido de un documento usando IA
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { documentContent, projectName, description, startDate, responsible } = body;

      if (!documentContent || !documentContent.trim()) {
        return NextResponse.json(
          { error: 'El contenido del documento es requerido' },
          { status: 400 }
        );
      }

      const openAIService = new OpenAIService();
      const auth = getAuraAuth();

      // Obtener información del usuario creador
      let responsibleName = responsible || user.name || 'Sin asignar';
      if (!responsible && user.email) {
        try {
          const creatorUser = await auth.getUserByEmail(user.email);
          responsibleName = creatorUser.displayName || creatorUser.email?.split('@')[0] || user.email;
        } catch (authError) {
          responsibleName = user.name || user.email?.split('@')[0] || 'Sin asignar';
        }
      }

      // Extraer información de la cotización del documento con IA
      console.log('[Generate from Document] Extrayendo información del documento con IA...');
      const extractedInfo = await openAIService.extractCotizacionFromDocument(documentContent);

      // Calcular fecha de fin basada en los meses estimados o usar 6 meses por defecto
      const startDateObj = startDate ? new Date(startDate) : new Date();
      const endDate = new Date(startDateObj);
      endDate.setMonth(endDate.getMonth() + (extractedInfo.meses || 6));

      // Generar descripción detallada del proyecto con IA
      console.log('[Generate from Document] Generando descripción del proyecto con IA...');
      const projectDescription = description || await openAIService.generateProjectDescription({
        titulo: projectName || extractedInfo.titulo || 'Proyecto',
        tipoProyecto: extractedInfo.tipoProyecto || 'Personalizado',
        descripcionAlcance: extractedInfo.descripcion || '',
        funcionalidades: extractedInfo.funcionalidades || [],
        pantallas: extractedInfo.pantallas || [],
        cliente: extractedInfo.cliente || 'Cliente',
      });

      // Crear el proyecto
      const projectData = {
        name: projectName || extractedInfo.titulo || 'Proyecto Generado',
        client: extractedInfo.cliente || 'Cliente',
        clientId: extractedInfo.clienteId || '',
        status: 'En desarrollo' as const,
        progress: 0,
        startDate: startDateObj.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        responsible: responsibleName,
        features: 0, // Se actualizará después de crear las features
        completedFeatures: 0,
        budget: extractedInfo.presupuesto || 0,
        hoursEstimated: extractedInfo.horasTotales || 0,
        hoursWorked: 0,
        description: projectDescription,
        createdBy: user.email || user.id || 'unknown',
      };

      const project = await projectsRepository.create(projectData);
      console.log('[Generate from Document] Proyecto creado:', project.id);

      // Generar features desde las funcionalidades extraídas
      if (extractedInfo.funcionalidades && extractedInfo.funcionalidades.length > 0) {
        console.log(`[Generate from Document] Generando ${extractedInfo.funcionalidades.length} features con IA...`);
        
        const featuresToCreate = await openAIService.generateFeaturesFromCotizacion({
          projectName: project.name,
          funcionalidades: extractedInfo.funcionalidades,
          pantallas: extractedInfo.pantallas || [],
          horasTotales: extractedInfo.horasTotales || 0,
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

          console.log(`[Generate from Document] ${createdFeatures.length} features creadas`);

          // Actualizar el proyecto con el número de features
          await projectsRepository.update(project.id, {
            features: createdFeatures.length,
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          project,
          featuresCount: extractedInfo.funcionalidades?.length || 0,
          message: `Proyecto creado exitosamente con ${extractedInfo.funcionalidades?.length || 0} funcionalidades`,
        },
      }, { status: 201 });
    } catch (error: any) {
      console.error('[Generate from Document] Error:', error);
      return NextResponse.json(
        { error: 'Error generando proyecto desde documento', message: error.message },
        { status: 500 }
      );
    }
  });
}














