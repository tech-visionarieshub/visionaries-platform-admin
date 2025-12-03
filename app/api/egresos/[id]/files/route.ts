import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { egresosRepository } from '@/lib/repositories/egresos-repository';
import { uploadFileToStorage, deleteFileFromStorage } from '@/lib/utils/storage-utils';
import { extractGoogleDriveFileId, downloadFileFromGoogleDrive, isValidGoogleDriveUrl } from '@/lib/utils/google-drive-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const egresoId = params.id;
      const formData = await request.formData();
      const fileType = formData.get('fileType') as string; // 'factura' o 'comprobante'
      const file = formData.get('file') as File | null;
      const googleDriveUrl = formData.get('googleDriveUrl') as string | null;

      if (!fileType || (fileType !== 'factura' && fileType !== 'comprobante')) {
        return NextResponse.json(
          { error: 'fileType debe ser "factura" o "comprobante"' },
          { status: 400 }
        );
      }

      // Verificar que el egreso existe
      const egreso = await egresosRepository.getById(egresoId);
      if (!egreso) {
        return NextResponse.json(
          { error: 'Egreso no encontrado' },
          { status: 404 }
        );
      }

      let fileUrl: string;
      let fileName: string;

      if (file) {
        // Subir archivo desde formulario
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fileName = file.name;
        fileUrl = await uploadFileToStorage(
          buffer,
          fileName,
          file.type,
          `egresos/${egresoId}`
        );
      } else if (googleDriveUrl && isValidGoogleDriveUrl(googleDriveUrl)) {
        // Descargar desde Google Drive
        const fileId = extractGoogleDriveFileId(googleDriveUrl);
        if (!fileId) {
          return NextResponse.json(
            { error: 'URL de Google Drive inválida' },
            { status: 400 }
          );
        }

        const fileBuffer = await downloadFileFromGoogleDrive(fileId);
        fileName = `${fileType}_${egresoId}.pdf`;
        const mimeType = 'application/pdf';
        
        fileUrl = await uploadFileToStorage(
          fileBuffer,
          fileName,
          mimeType,
          `egresos/${egresoId}`
        );
      } else {
        return NextResponse.json(
          { error: 'Debe proporcionar un archivo o una URL de Google Drive' },
          { status: 400 }
        );
      }

      // Actualizar egreso
      const updateData: any = {};
      if (fileType === 'factura') {
        updateData.facturaUrl = fileUrl;
        updateData.facturaFileName = fileName;
      } else {
        updateData.comprobanteUrl = fileUrl;
        updateData.comprobanteFileName = fileName;
      }

      await egresosRepository.update(egresoId, updateData);

      return NextResponse.json({
        success: true,
        fileUrl,
        fileName,
      });
    } catch (error: any) {
      console.error('[Files API] Error:', error);
      return NextResponse.json(
        { error: 'Error al subir archivo', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const egresoId = params.id;
      const egreso = await egresosRepository.getById(egresoId);

      if (!egreso) {
        return NextResponse.json(
          { error: 'Egreso no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        factura: egreso.facturaUrl ? {
          url: egreso.facturaUrl,
          fileName: egreso.facturaFileName,
        } : null,
        comprobante: egreso.comprobanteUrl ? {
          url: egreso.comprobanteUrl,
          fileName: egreso.comprobanteFileName,
        } : null,
      });
    } catch (error: any) {
      console.error('[Files API] Error:', error);
      return NextResponse.json(
        { error: 'Error al obtener archivos', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const egresoId = params.id;
      const { searchParams } = new URL(request.url);
      const fileType = searchParams.get('fileType'); // 'factura' o 'comprobante'

      if (!fileType || (fileType !== 'factura' && fileType !== 'comprobante')) {
        return NextResponse.json(
          { error: 'fileType debe ser "factura" o "comprobante"' },
          { status: 400 }
        );
      }

      const egreso = await egresosRepository.getById(egresoId);
      if (!egreso) {
        return NextResponse.json(
          { error: 'Egreso no encontrado' },
          { status: 404 }
        );
      }

      const fileUrl = fileType === 'factura' ? egreso.facturaUrl : egreso.comprobanteUrl;

      if (fileUrl) {
        await deleteFileFromStorage(fileUrl);
      }

      // Actualizar egreso
      const updateData: any = {};
      if (fileType === 'factura') {
        updateData.facturaUrl = null;
        updateData.facturaFileName = null;
      } else {
        updateData.comprobanteUrl = null;
        updateData.comprobanteFileName = null;
      }

      await egresosRepository.update(egresoId, updateData);

      return NextResponse.json({
        success: true,
        message: 'Archivo eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('[Files API] Error:', error);
      return NextResponse.json(
        { error: 'Error al eliminar archivo', message: error.message },
        { status: 500 }
      );
    }
  });
}


