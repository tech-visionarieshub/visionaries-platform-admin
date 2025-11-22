import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository';
import type { QATask, QATaskCategory, QATaskStatus } from '@/types/qa';
import { z } from 'zod';

/**
 * API CRUD para una tarea QA específica
 * GET /api/projects/[id]/qa-tasks/[taskId] - Obtener tarea
 * PUT /api/projects/[id]/qa-tasks/[taskId] - Actualizar tarea
 * DELETE /api/projects/[id]/qa-tasks/[taskId] - Eliminar tarea
 */

const updateTaskSchema = z.object({
  titulo: z.string().min(1).optional(),
  categoria: z.enum(['Funcionalidades Nuevas', 'QA', 'Bugs Generales', 'Otra']).optional(),
  tipo: z.string().optional(),
  criterios_aceptacion: z.string().optional(),
  comentarios: z.string().optional(),
  estado: z.enum(['Pendiente', 'En Progreso', 'Completado', 'Bloqueado', 'Cancelado']).optional(),
  imagenes: z.array(z.object({
    url: z.string(),
    name: z.string(),
    uploadedAt: z.string().or(z.date()),
    size: z.number(),
  })).optional(),
}).partial();

export async function GET(
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

    // Obtener tarea
    const task = await qaTasksRepository.getById(params.id, params.taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[QA Task GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener tarea QA' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Validar y parsear body
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Verificar que la tarea existe
    const existingTask = await qaTasksRepository.getById(params.id, params.taskId);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Partial<QATask> = { ...validatedData };
    
    // Convertir fechas de imágenes si existen
    if (updateData.imagenes) {
      updateData.imagenes = updateData.imagenes.map(img => ({
        ...img,
        uploadedAt: typeof img.uploadedAt === 'string' ? new Date(img.uploadedAt) : img.uploadedAt,
      }));
    }

    // Actualizar tarea
    const updatedTask = await qaTasksRepository.update(
      params.id,
      params.taskId,
      updateData
    );

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error('[QA Task PUT] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar tarea QA' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existingTask = await qaTasksRepository.getById(params.id, params.taskId);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar tarea
    await qaTasksRepository.delete(params.id, params.taskId);

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente',
    });
  } catch (error: any) {
    console.error('[QA Task DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar tarea QA' },
      { status: 500 }
    );
  }
}


