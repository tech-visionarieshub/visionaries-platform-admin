import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { openAIService } from '@/lib/services/openai-service';
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository';
import { z } from 'zod';

/**
 * API para generar criterios de aceptación con OpenAI
 * POST /api/projects/[id]/qa-tasks/[taskId]/generate-criteria
 * 
 * Body opcional: { force: boolean } - Si force=true, regenera incluso si ya existen criterios
 * 
 * Retorna: { criteria: string }
 */

const generateCriteriaSchema = z.object({
  force: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    // Verificar autenticación
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = await verifyIdToken(token);
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    const hasInternalAccess = decoded.internal === true;

    if (!hasInternalAccess && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta funcionalidad' },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe
    const task = await qaTasksRepository.getById(params.id, params.taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Validar body
    const body = await request.json().catch(() => ({}));
    const { force } = generateCriteriaSchema.parse(body);

    // Si ya existen criterios y no se fuerza, retornar error
    if (task.criterios_aceptacion && task.criterios_aceptacion.trim() !== '' && !force) {
      return NextResponse.json(
        { error: 'La tarea ya tiene criterios de aceptación. Usa force=true para regenerarlos.' },
        { status: 400 }
      );
    }

    try {
      // Generar criterios con OpenAI (con timeout de 30s)
      const generatePromise = openAIService.generateAcceptanceCriteria({
        titulo: task.titulo,
        categoria: task.categoria,
        tipo: task.tipo,
        comentarios: task.comentarios,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La generación tardó más de 30 segundos')), 30000);
      });

      const criteria = await Promise.race([generatePromise, timeoutPromise]);

      // Opcionalmente, actualizar la tarea con los criterios generados
      // (el frontend puede decidir si guardarlos o no)
      
      return NextResponse.json({
        success: true,
        criteria,
      });
    } catch (error: any) {
      console.error('[Generate Criteria] Error generando criterios:', error);
      
      if (error.message?.includes('Timeout')) {
        return NextResponse.json(
          { error: 'La generación tardó demasiado. Intenta nuevamente o verifica tu conexión.' },
          { status: 408 }
        );
      }

      if (error.message?.includes('OpenAI') || error.message?.includes('API key')) {
        return NextResponse.json(
          { error: 'Error al generar criterios con OpenAI. Verifica que la API key esté configurada en Settings.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Error al generar criterios: ${error.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Generate Criteria] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error desconocido al generar criterios' },
      { status: 500 }
    );
  }
}


