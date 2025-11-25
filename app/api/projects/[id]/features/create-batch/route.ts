import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import { z } from 'zod';
import type { FeaturePriority } from '@/types/feature';

/**
 * API para crear múltiples features en batch
 * POST /api/projects/[id]/features/create-batch
 * 
 * Body: { features: Array<FeatureData> }
 * 
 * Retorna: { success: true, features: Feature[], count: number }
 */

const featureSchema = z.object({
  epicTitle: z.string().min(1, 'El Epic es requerido'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  criteriosAceptacion: z.string().optional(),
  comentarios: z.string().optional(),
  tipo: z.enum(['Funcionalidad', 'QA', 'Bug']).optional(),
  categoria: z.enum(['Funcionalidad', 'QA', 'Bugs Generales', 'Otra']).optional(),
  status: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done', 'completed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  storyPoints: z.number().min(0).optional(),
  sprint: z.string().optional(),
});

const createBatchSchema = z.object({
  features: z.array(featureSchema).min(1, 'Debe haber al menos una funcionalidad'),
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
    const validated = createBatchSchema.parse(body);

    // Obtener nombre del proyecto para generar IDs
    const projectDoc = await getInternalFirestore().collection('projects').doc(id).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const projectName = projectDoc.data()?.name;

    // Función helper para limpiar valores undefined (Firestore no los acepta)
    const cleanFeature = (f: z.infer<typeof featureSchema>) => {
      const feature: any = {
        projectId: id,
        epicTitle: f.epicTitle,
        title: f.title,
        description: f.description || '',
        status: f.status || 'backlog' as const,
        priority: (f.priority || 'medium') as FeaturePriority,
        createdBy: decoded.email || decoded.uid || 'unknown',
      };

      // Solo agregar campos opcionales si tienen valor (no undefined)
      if (f.criteriosAceptacion !== undefined && f.criteriosAceptacion !== null && f.criteriosAceptacion !== '') {
        feature.criteriosAceptacion = f.criteriosAceptacion;
      }
      if (f.comentarios !== undefined && f.comentarios !== null && f.comentarios !== '') {
        feature.comentarios = f.comentarios;
      }
      if (f.tipo !== undefined && f.tipo !== null) {
        feature.tipo = f.tipo;
      }
      if (f.categoria !== undefined && f.categoria !== null) {
        feature.categoria = f.categoria;
      }
      if (f.assignee !== undefined && f.assignee !== null && f.assignee !== '') {
        feature.assignee = f.assignee;
      }
      if (f.estimatedHours !== undefined && f.estimatedHours !== null) {
        feature.estimatedHours = f.estimatedHours;
      }
      if (f.actualHours !== undefined && f.actualHours !== null) {
        feature.actualHours = f.actualHours;
      }
      if (f.storyPoints !== undefined && f.storyPoints !== null) {
        feature.storyPoints = f.storyPoints;
      }
      if (f.sprint !== undefined && f.sprint !== null && f.sprint !== '') {
        feature.sprint = f.sprint;
      }

      return feature;
    };

    // Preparar features para crear
    const featuresToCreate = validated.features.map(cleanFeature);

    // Crear features en batch
    console.log(`[Create Batch Features] Creando ${featuresToCreate.length} funcionalidades para proyecto ${id}`);
    const createdFeatures = await featuresRepository.createBatch(id, featuresToCreate, projectName);

    console.log(`[Create Batch Features] Se crearon ${createdFeatures.length} funcionalidades exitosamente`);

    return NextResponse.json({
      success: true,
      features: createdFeatures,
      count: createdFeatures.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Create Batch Features] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error desconocido al crear funcionalidades' },
      { status: 500 }
    );
  }
}

