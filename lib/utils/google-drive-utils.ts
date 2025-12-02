/**
 * Utilidades para trabajar con Google Drive
 */

/**
 * Extrae el File ID de una URL de Google Drive
 * Soporta múltiples formatos:
 * - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://docs.google.com/document/d/{FILE_ID}/edit
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Formato: /file/d/{FILE_ID}/view
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return fileIdMatch[1];
  }

  // Formato: /open?id={FILE_ID}
  const openIdMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch && openIdMatch[1]) {
    return openIdMatch[1];
  }

  // Formato: /document/d/{FILE_ID}/edit
  const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docIdMatch && docIdMatch[1]) {
    return docIdMatch[1];
  }

  // Formato: /spreadsheets/d/{FILE_ID}/edit
  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetIdMatch && sheetIdMatch[1]) {
    return sheetIdMatch[1];
  }

  return null;
}

/**
 * Descarga un archivo desde Google Drive usando el método de exportación directa
 * Este método funciona para archivos públicos o con permisos compartidos
 * 
 * @param fileId - ID del archivo en Google Drive
 * @param mimeType - Tipo MIME del archivo (opcional, se intenta detectar)
 * @returns Buffer del archivo descargado
 */
export async function downloadFileFromGoogleDrive(
  fileId: string,
  mimeType?: string
): Promise<Buffer> {
  try {
    // Método 1: Intentar descarga directa (solo para archivos públicos)
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      // Si la respuesta no es OK, puede ser que el archivo requiera confirmación
      // Google Drive a veces devuelve una página HTML de confirmación para archivos grandes
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/html')) {
        // Intentar extraer el token de confirmación y hacer otra petición
        const html = await response.text();
        const confirmTokenMatch = html.match(/name="confirm"\s+value="([^"]+)"/);
        
        if (confirmTokenMatch && confirmTokenMatch[1]) {
          const confirmToken = confirmTokenMatch[1];
          const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
          
          const confirmResponse = await fetch(confirmUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          if (!confirmResponse.ok) {
            throw new Error(`Error descargando archivo: ${confirmResponse.status} ${confirmResponse.statusText}`);
          }

          const arrayBuffer = await confirmResponse.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }

      throw new Error(`Error descargando archivo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    throw new Error(`Error al descargar archivo de Google Drive: ${error.message}`);
  }
}

/**
 * Valida si una URL es una URL válida de Google Drive
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com')
  ) && extractGoogleDriveFileId(url) !== null;
}

/**
 * Obtiene el tipo MIME de un archivo basado en su extensión o contenido
 */
export function getMimeTypeFromFileName(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Valida si un tipo MIME es permitido (PDF, JPG, PNG)
 */
export function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  return allowedTypes.includes(mimeType.toLowerCase());
}

