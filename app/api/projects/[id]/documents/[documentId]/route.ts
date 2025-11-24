import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { projectDocumentsRepository } from '@/lib/repositories/project-documents-repository';

type DocumentParamsContext = {
  params: Promise<{ id: string; documentId: string }>;
};

/**
 * GET - Obtener un documento específico
 */
export async function GET(
  request: NextRequest,
  context: DocumentParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, documentId } = await context.params;
      const document = await projectDocumentsRepository.getById(projectId, documentId);

      if (!document) {
        return NextResponse.json(
          { error: 'Documento no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document,
      });
    } catch (error: any) {
      console.error('[Document GET] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener documento' },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT - Actualizar un documento
 */
export async function PUT(
  request: NextRequest,
  context: DocumentParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, documentId } = await context.params;
      const body = await request.json();

      const { name, type, category, version, driveUrl } = body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (type !== undefined) updates.type = type;
      if (category !== undefined) updates.category = category;
      if (version !== undefined) updates.version = version;
      if (driveUrl !== undefined) updates.driveUrl = driveUrl;

      const updatedDocument = await projectDocumentsRepository.update(projectId, documentId, updates);

      return NextResponse.json({
        success: true,
        document: updatedDocument,
      });
    } catch (error: any) {
      console.error('[Document PUT] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al actualizar documento' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE - Eliminar un documento
 */
export async function DELETE(
  request: NextRequest,
  context: DocumentParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId, documentId } = await context.params;
      await projectDocumentsRepository.delete(projectId, documentId);

      return NextResponse.json({
        success: true,
        message: 'Documento eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('[Document DELETE] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al eliminar documento' },
        { status: 500 }
      );
    }
  });
}

