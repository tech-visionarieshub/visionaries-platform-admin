import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { openAIService } from '@/lib/services/openai-service';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { z } from 'zod';

/**
 * API para generar features desde un transcript de reunión
 * POST /api/projects/[id]/features/generate-from-transcript
 * 
 * Body: { transcript: string }
 * 
 * Retorna: { success: true, features: Array<FeaturePreview> }
 */

const transcriptSchema = z.object({
  transcript: z.string().min(100, 'El transcript debe tener al menos 100 caracteres').max(100000, 'El transcript no puede exceder 100,000 caracteres'),
});

type ProjectParamsContext = { params: Promise<{ id: string }> };

export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params;

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

    // Validar body
    const body = await request.json().catch(() => ({}));
    const validated = transcriptSchema.parse(body);

    // Obtener features existentes del proyecto para comparar
    console.log(`[Generate from Transcript] Obteniendo features existentes para proyecto ${id}`);
    const existingFeatures = await featuresRepository.getAll(id);
    console.log(`[Generate from Transcript] Se encontraron ${existingFeatures.length} features existentes`);

    // Procesar transcript con IA (con timeout de 60 segundos)
    console.log(`[Generate from Transcript] Procesando transcript de ${validated.transcript.length} caracteres para proyecto ${id}`);

    let features;
    try {
      const generatePromise = openAIService.generateFeaturesFromTranscript(validated.transcript);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: El procesamiento tardó más de 60 segundos')), 60000);
      });

      features = await Promise.race([generatePromise, timeoutPromise]);
    } catch (generateError: any) {
      console.error('[Generate from Transcript] Error en generateFeaturesFromTranscript:', generateError);
      throw generateError; // Re-lanzar para que sea manejado por el catch general
    }

    console.log(`[Generate from Transcript] Se generaron ${features.length} funcionalidades`);

    // Detectar duplicados con IA si hay features existentes
    let featuresWithDuplicates = features;
    if (existingFeatures.length > 0 && features.length > 0) {
      console.log(`[Generate from Transcript] Detectando duplicados con IA...`);
      try {
        const duplicateInfo = await openAIService.detectDuplicateFeatures(
          features.map(f => ({
            title: f.title,
            description: f.description,
            epicTitle: f.epicTitle,
          })),
          existingFeatures.map(f => ({
            title: f.title,
            description: f.description || '',
            epicTitle: f.epicTitle,
          }))
        );

        // Combinar información de duplicados con las features
        featuresWithDuplicates = features.map((feature, index) => ({
          ...feature,
          isPossibleDuplicate: duplicateInfo[index]?.isPossibleDuplicate || false,
          duplicateOf: duplicateInfo[index]?.duplicateOf || null,
          similarityScore: duplicateInfo[index]?.similarityScore || 0,
        }));

        const duplicatesCount = duplicateInfo.filter(d => d.isPossibleDuplicate).length;
        console.log(`[Generate from Transcript] Se detectaron ${duplicatesCount} posibles duplicados`);
      } catch (error: any) {
        console.warn('[Generate from Transcript] Error detectando duplicados, continuando sin detección:', error);
        // Si falla la detección, continuar sin marcar duplicados
        featuresWithDuplicates = features.map(f => ({
          ...f,
          isPossibleDuplicate: false,
          duplicateOf: null,
          similarityScore: 0,
        }));
      }
    } else {
      // Si no hay features existentes, agregar campos de duplicado como false
      featuresWithDuplicates = features.map(f => ({
        ...f,
        isPossibleDuplicate: false,
        duplicateOf: null,
        similarityScore: 0,
      }));
    }

    return NextResponse.json({
      success: true,
      features: featuresWithDuplicates,
      count: featuresWithDuplicates.length,
    });
  } catch (error: any) {
    console.error('[Generate from Transcript] Error completo:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    if (error.message?.includes('Timeout')) {
      return NextResponse.json(
        { error: 'El procesamiento tardó demasiado. Intenta con un transcript más corto o verifica tu conexión.' },
        { status: 408 }
      );
    }

    // Error específico de API key no configurada
    if (error.message?.includes('API key no está configurada') || error.message?.includes('no está configurada')) {
      return NextResponse.json(
        { error: error.message || 'OpenAI API key no está configurada. Ve a Settings para configurarla.' },
        { status: 500 }
      );
    }

    // Otros errores de OpenAI
    if (error.message?.includes('OpenAI') || error.message?.includes('OpenAI API error')) {
      return NextResponse.json(
        { error: error.message || 'Error al procesar con OpenAI. Verifica que la API key esté configurada en Settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error desconocido al generar funcionalidades' },
      { status: 500 }
    );
  }
}
