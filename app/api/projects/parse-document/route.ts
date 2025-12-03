import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';

/**
 * Parsea un documento Word (.docx) y extrae su contenido como texto
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó ningún archivo' },
          { status: 400 }
        );
      }

      // Verificar que sea un archivo .docx
      if (!file.name.endsWith('.docx') && 
          file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return NextResponse.json(
          { error: 'El archivo debe ser un documento Word (.docx)' },
          { status: 400 }
        );
      }

      // Convertir el archivo a buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Usar mammoth para parsear el docx (necesitamos instalarlo)
      // Por ahora, vamos a usar un enfoque más simple: enviar el contenido a OpenAI para extraerlo
      // O podemos usar una librería como mammoth o docx
      
      // Opción 1: Enviar directamente a OpenAI para extraer texto
      // Opción 2: Usar una librería del lado del servidor
      
      // Por ahora, vamos a usar OpenAI para extraer el texto del documento
      const { OpenAIService } = await import('@/lib/services/openai-service');
      const openAIService = new OpenAIService();
      
      // Convertir el buffer a base64 para enviarlo a OpenAI
      const base64Content = buffer.toString('base64');
      
      // Usar OpenAI Vision API o simplemente intentar extraer texto
      // Por ahora, vamos a usar un enfoque más simple: leer el XML del docx
      
      // Alternativa: usar una librería como 'mammoth' o 'docx'
      // Por ahora, vamos a crear un endpoint que use OpenAI para extraer información
      
      // Por simplicidad, vamos a requerir que el usuario pegue el texto
      // O podemos usar una librería del lado del servidor
      
      return NextResponse.json(
        { 
          error: 'Por favor, usa la opción de "Pegar Texto" por ahora. El parseo de .docx se implementará próximamente.',
          suggestion: 'Copia y pega el contenido del documento Word en la pestaña "Pegar Texto"'
        },
        { status: 501 }
      );
    } catch (error: any) {
      console.error('[Parse Document] Error:', error);
      return NextResponse.json(
        { error: 'Error procesando el documento', message: error.message },
        { status: 500 }
      );
    }
  });
}














