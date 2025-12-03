import { getInternalStorage } from '@/lib/firebase/admin-platform';
import { isValidFileType } from './google-drive-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Sube un archivo a Firebase Storage
 * 
 * @param fileBuffer - Buffer del archivo
 * @param fileName - Nombre del archivo
 * @param mimeType - Tipo MIME del archivo
 * @param folderPath - Ruta de la carpeta en Storage (ej: 'egresos/{egresoId}')
 * @returns URL pública del archivo subido
 */
export async function uploadFileToStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderPath: string
): Promise<string> {
  // Validar tipo de archivo
  if (!isValidFileType(mimeType)) {
    throw new Error(`Tipo de archivo no permitido: ${mimeType}. Solo se permiten PDF, JPG y PNG.`);
  }

  // Validar tamaño
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  try {
    const storage = getInternalStorage();
    const bucket = storage.bucket();

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folderPath}/${timestamp}_${sanitizedName}`;

    const fileRef = bucket.file(storagePath);

    // Subir el archivo
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalFileName: fileName,
        },
      },
    });

    // Hacer el archivo público
    await fileRef.makePublic();

    // Obtener URL pública
    const publicUrl = fileRef.publicUrl();

    return publicUrl;
  } catch (error: any) {
    throw new Error(`Error al subir archivo a Storage: ${error.message}`);
  }
}

/**
 * Elimina un archivo de Firebase Storage
 * 
 * @param fileUrl - URL pública del archivo
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  try {
    const storage = getInternalStorage();
    const bucket = storage.bucket();

    // Extraer la ruta del archivo desde la URL
    // Formato: https://storage.googleapis.com/bucket-name/path/to/file
    const urlObj = new URL(fileUrl);
    const filePath = urlObj.pathname.substring(1); // Remover el primer /

    const fileRef = bucket.file(filePath);

    // Verificar si el archivo existe
    const [exists] = await fileRef.exists();
    if (!exists) {
      console.warn(`Archivo no existe en Storage: ${filePath}`);
      return;
    }

    // Eliminar el archivo
    await fileRef.delete();
  } catch (error: any) {
    // No lanzar error si el archivo no existe
    if (error.code === 404) {
      console.warn(`Archivo no encontrado en Storage: ${fileUrl}`);
      return;
    }
    throw new Error(`Error al eliminar archivo de Storage: ${error.message}`);
  }
}

/**
 * Obtiene información de un archivo en Storage
 */
export async function getFileInfo(fileUrl: string): Promise<{
  exists: boolean;
  size?: number;
  contentType?: string;
}> {
  try {
    const storage = getInternalStorage();
    const bucket = storage.bucket();

    const urlObj = new URL(fileUrl);
    const filePath = urlObj.pathname.substring(1);

    const fileRef = bucket.file(filePath);
    const [exists] = await fileRef.exists();

    if (!exists) {
      return { exists: false };
    }

    const [metadata] = await fileRef.getMetadata();

    return {
      exists: true,
      size: metadata.size ? parseInt(metadata.size, 10) : undefined,
      contentType: metadata.contentType,
    };
  } catch (error: any) {
    return { exists: false };
  }
}


