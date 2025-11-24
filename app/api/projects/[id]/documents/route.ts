import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { projectDocumentsRepository } from '@/lib/repositories/project-documents-repository';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET - Obtener todos los documentos de un proyecto
 */
export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const documents = await projectDocumentsRepository.getAll(projectId);

      return NextResponse.json({
        success: true,
        documents,
      });
    } catch (error: any) {
      console.error('[Documents GET] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener documentos' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST - Crear un nuevo documento
 */
export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const body = await request.json();

      const { name, type, category, version, driveUrl } = body;

      if (!name || !category || !driveUrl) {
        return NextResponse.json(
          { error: 'name, category y driveUrl son requeridos' },
          { status: 400 }
        );
      }

      const document = await projectDocumentsRepository.create(projectId, {
        projectId,
        name,
        type: type || '',
        category,
        version,
        driveUrl,
        createdBy: user.uid || user.email || 'unknown',
      });

      return NextResponse.json({
        success: true,
        document,
      });
    } catch (error: any) {
      console.error('[Documents POST] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al crear documento' },
        { status: 500 }
      );
    }
  });
}

