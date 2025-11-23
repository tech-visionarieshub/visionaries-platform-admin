import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { getInternalStorage } from '@/lib/firebase/admin-platform';
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository';
import type { QAImage } from '@/types/qa';

/**
 * API para gestión de imágenes de tareas QA
 * POST /api/projects/[id]/qa-tasks/[taskId]/images - Subir imagen
 * DELETE /api/projects/[id]/qa-tasks/[taskId]/images?imageUrl=... - Eliminar imagen
 */

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type TaskImageParamsContext = { params: Promise<{ id: string; taskId: string }> };

export async function POST(
  request: NextRequest,
  context: TaskImageParamsContext
) {
  const { id, taskId } = await context.params;

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
    const task = await qaTasksRepository.getById(id, taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    try {
      // Convertir File a Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `qa-tasks/${id}/${taskId}/${timestamp}_${sanitizedName}`;

      // Subir a Firebase Storage
      const storage = getInternalStorage();
      const bucket = storage.bucket();
      const fileRef = bucket.file(fileName);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedAt: new Date().toISOString(),
            uploadedBy: decoded.email || decoded.uid || 'unknown',
            projectId: id,
            taskId: taskId,
          },
        },
      });

      // Hacer el archivo público
      await fileRef.makePublic();

      // Obtener URL pública
      const publicUrl = fileRef.publicUrl();

      // Crear objeto de imagen
      const newImage: QAImage = {
        url: publicUrl,
        name: file.name,
        uploadedAt: new Date(),
        size: file.size,
      };

      // Agregar imagen a la tarea
      const updatedImages = [...(task.imagenes || []), newImage];
      await qaTasksRepository.update(id, taskId, {
        imagenes: updatedImages,
      });

      return NextResponse.json({
        success: true,
        image: newImage,
      }, { status: 201 });
    } catch (error: any) {
      console.error('[Image Upload] Error subiendo archivo:', error);
      return NextResponse.json(
        { error: `Error al subir imagen: ${error.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Image Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido al subir imagen' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: TaskImageParamsContext
) {
  const { id, taskId } = await context.params;

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
    const task = await qaTasksRepository.getById(id, taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Obtener URL de imagen a eliminar
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de imagen no proporcionada' },
        { status: 400 }
      );
    }

    try {
      // Extraer path del archivo desde la URL
      // La URL de Firebase Storage tiene formato: https://storage.googleapis.com/bucket-name/path/to/file
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split('/');
      const bucketName = pathParts[1];
      const filePath = pathParts.slice(2).join('/');

      // Eliminar de Firebase Storage
      const storage = getInternalStorage();
      const bucket = storage.bucket(bucketName);
      const fileRef = bucket.file(filePath);

      // Verificar que el archivo existe antes de eliminarlo
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
      }

      // Eliminar imagen de la lista de la tarea
      const updatedImages = (task.imagenes || []).filter(img => img.url !== imageUrl);
      await qaTasksRepository.update(id, taskId, {
        imagenes: updatedImages,
      });

      return NextResponse.json({
        success: true,
        message: 'Imagen eliminada correctamente',
      });
    } catch (error: any) {
      console.error('[Image Delete] Error eliminando archivo:', error);
      
      // Si el archivo no existe en Storage, solo eliminarlo de la lista
      if (error.code === 404 || error.message?.includes('No such object')) {
        const updatedImages = (task.imagenes || []).filter(img => img.url !== imageUrl);
        await qaTasksRepository.update(id, taskId, {
          imagenes: updatedImages,
        });
        
        return NextResponse.json({
          success: true,
          message: 'Imagen eliminada de la tarea (no existía en Storage)',
        });
      }

      return NextResponse.json(
        { error: `Error al eliminar imagen: ${error.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Image Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido al eliminar imagen' },
      { status: 500 }
    );
  }
}


