import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository';
import type { QATask, QATaskCategory, QATaskStatus } from '@/types/qa';
import { z } from 'zod';

/**
 * API CRUD para tareas QA
 * GET /api/projects/[id]/qa-tasks - Listar todas las tareas
 * POST /api/projects/[id]/qa-tasks - Crear nueva tarea
 */

const createTaskSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  categoria: z.enum(['Funcionalidades Nuevas', 'QA', 'Bugs Generales', 'Otra']),
  tipo: z.string().optional(),
  criterios_aceptacion: z.string().optional().default(''),
  comentarios: z.string().optional().default(''),
  estado: z.enum(['Pendiente', 'En Progreso', 'Completado', 'Bloqueado', 'Cancelado']).optional().default('Pendiente'),
  imagenes: z.array(z.object({
    url: z.string(),
    name: z.string(),
    uploadedAt: z.string().or(z.date()),
    size: z.number(),
  })).optional().default([]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Obtener parámetros de filtro opcionales
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as QATaskCategory | null;
    const status = searchParams.get('status') as QATaskStatus | null;

    let tasks: QATask[];

    if (category) {
      tasks = await qaTasksRepository.getByCategory(params.id, category);
    } else if (status) {
      tasks = await qaTasksRepository.getByStatus(params.id, status);
    } else {
      tasks = await qaTasksRepository.getAll(params.id);
    }

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error('[QA Tasks GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener tareas QA' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const validatedData = createTaskSchema.parse(body);

    // Crear tarea
    const newTask = await qaTasksRepository.create(params.id, {
      ...validatedData,
      imagenes: validatedData.imagenes?.map(img => ({
        ...img,
        uploadedAt: typeof img.uploadedAt === 'string' ? new Date(img.uploadedAt) : img.uploadedAt,
      })) || [],
      createdBy: decoded.email || decoded.uid || 'unknown',
      projectId: params.id,
    });

    return NextResponse.json({
      success: true,
      task: newTask,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[QA Tasks POST] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear tarea QA' },
      { status: 500 }
    );
  }
}


