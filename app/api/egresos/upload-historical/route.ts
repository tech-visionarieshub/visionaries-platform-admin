import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { egresosRepository } from '@/lib/repositories/egresos-repository';
import { extractGoogleDriveFileId, downloadFileFromGoogleDrive, isValidGoogleDriveUrl, getMimeTypeFromFileName } from '@/lib/utils/google-drive-utils';
import { uploadFileToStorage } from '@/lib/utils/storage-utils';
import type { Egreso } from '@/lib/mock-data/finanzas';
import Papa from 'papaparse';

interface CSVRow {
  'Línea de negocio': string;
  'Categoría': string;
  'Empresa': string;
  'Equipo': string;
  'Concepto': string;
  'Subtotal': string;
  'IVA': string;
  'Total': string;
  'Tipo': string;
  'Mes': string;
  'Status': string;
  'Factura': string;
  'Comprobante': string;
  'Fecha pago': string;
}

export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const formData = await request.formData();
      const csvFile = formData.get('csv') as File;

      if (!csvFile) {
        return NextResponse.json(
          { error: 'No se proporcionó archivo CSV' },
          { status: 400 }
        );
      }

      // Leer y parsear CSV
      const csvText = await csvFile.text();
      const parseResult = Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      });

      const records = parseResult.data;

      if (records.length === 0) {
        return NextResponse.json(
          { error: 'El CSV está vacío o no tiene datos válidos' },
          { status: 400 }
        );
      }

      // Validar columnas requeridas
      const requiredColumns = [
        'Línea de negocio',
        'Categoría',
        'Empresa',
        'Equipo',
        'Concepto',
        'Subtotal',
        'IVA',
        'Total',
        'Tipo',
        'Mes',
        'Status',
        'Factura',
        'Comprobante',
        'Fecha pago',
      ];

      const firstRow = records[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return NextResponse.json(
          { 
            error: 'Columnas faltantes en el CSV',
            missingColumns 
          },
          { status: 400 }
        );
      }

      const results = {
        success: 0,
        errors: 0,
        details: [] as Array<{ row: number; success: boolean; message: string; egresoId?: string }>,
      };

      // Procesar cada fila
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 porque la primera fila es el header y empezamos desde 1

        try {
          // Convertir valores numéricos
          const subtotal = parseFloat(row.Subtotal.replace(/,/g, '')) || 0;
          const iva = parseFloat(row.IVA.replace(/,/g, '')) || 0;
          const total = parseFloat(row.Total.replace(/,/g, '')) || 0;

          // Validar tipo
          if (row.Tipo !== 'Variable' && row.Tipo !== 'Fijo') {
            throw new Error(`Tipo inválido: ${row.Tipo}. Debe ser "Variable" o "Fijo"`);
          }

          // Validar status
          const validStatuses = ['Pagado', 'Pendiente', 'Cancelado'];
          if (!validStatuses.includes(row.Status)) {
            throw new Error(`Status inválido: ${row.Status}. Debe ser uno de: ${validStatuses.join(', ')}`);
          }

          // Crear objeto egreso
          const egresoData: Omit<Egreso, 'id'> = {
            lineaNegocio: row['Línea de negocio'] || '',
            categoria: row.Categoría || '',
            empresa: row.Empresa || '',
            equipo: row.Equipo || '',
            concepto: row.Concepto || '',
            subtotal,
            iva,
            total,
            tipo: row.Tipo as 'Variable' | 'Fijo',
            mes: row.Mes || '',
            status: row.Status as 'Pagado' | 'Pendiente' | 'Cancelado',
            tipoEgreso: 'basadoEnHoras',
            fechaPago: row['Fecha pago'] || undefined,
          };

          // Crear egreso primero para obtener el ID
          const egreso = await egresosRepository.create(egresoData);
          const egresoId = egreso.id;

          // Procesar factura si existe
          if (row.Factura && row.Factura.trim() !== '') {
            try {
              if (isValidGoogleDriveUrl(row.Factura)) {
                const fileId = extractGoogleDriveFileId(row.Factura);
                if (fileId) {
                  const fileBuffer = await downloadFileFromGoogleDrive(fileId);
                  const mimeType = 'application/pdf'; // Asumimos PDF por defecto, se puede mejorar detectando el tipo
                  
                  // Intentar detectar el tipo desde el nombre si está en la URL
                  const fileName = `factura_${egresoId}.pdf`;
                  
                  const facturaUrl = await uploadFileToStorage(
                    fileBuffer,
                    fileName,
                    mimeType,
                    `egresos/${egresoId}`
                  );

                  await egresosRepository.update(egresoId, {
                    facturaUrl,
                    facturaFileName: fileName,
                  });
                }
              }
            } catch (error: any) {
              console.error(`Error procesando factura para fila ${rowNumber}:`, error);
              // Continuar aunque falle la factura
            }
          }

          // Procesar comprobante si existe
          if (row.Comprobante && row.Comprobante.trim() !== '') {
            try {
              if (isValidGoogleDriveUrl(row.Comprobante)) {
                const fileId = extractGoogleDriveFileId(row.Comprobante);
                if (fileId) {
                  const fileBuffer = await downloadFileFromGoogleDrive(fileId);
                  const mimeType = 'application/pdf';
                  const fileName = `comprobante_${egresoId}.pdf`;
                  
                  const comprobanteUrl = await uploadFileToStorage(
                    fileBuffer,
                    fileName,
                    mimeType,
                    `egresos/${egresoId}`
                  );

                  await egresosRepository.update(egresoId, {
                    comprobanteUrl,
                    comprobanteFileName: fileName,
                  });
                }
              }
            } catch (error: any) {
              console.error(`Error procesando comprobante para fila ${rowNumber}:`, error);
              // Continuar aunque falle el comprobante
            }
          }

          results.success++;
          results.details.push({
            row: rowNumber,
            success: true,
            message: 'Egreso creado exitosamente',
            egresoId,
          });
        } catch (error: any) {
          results.errors++;
          results.details.push({
            row: rowNumber,
            success: false,
            message: error.message || 'Error desconocido',
          });
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          total: records.length,
          success: results.success,
          errors: results.errors,
        },
        details: results.details,
      });
    } catch (error: any) {
      console.error('[Upload Historical] Error:', error);
      return NextResponse.json(
        { error: 'Error procesando CSV', message: error.message },
        { status: 500 }
      );
    }
  });
}

