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

/**
 * Normaliza el formato del mes
 * Convierte diferentes formatos a un formato estándar: "Mes Año" (ej: "Diciembre 2025")
 * Maneja casos como: "Diciembre25", "Diciembre 25", "Diciembre2025", "Diciembre 2025", etc.
 */
function normalizeMes(mes: string): string {
  if (!mes || mes.trim() === '') return '';
  
  const mesTrimmed = mes.trim();
  const mesLower = mesTrimmed.toLowerCase();
  
  // Mapeo de meses en español
  const mesesMap: Record<string, string> = {
    'enero': 'Enero',
    'febrero': 'Febrero',
    'marzo': 'Marzo',
    'abril': 'Abril',
    'mayo': 'Mayo',
    'junio': 'Junio',
    'julio': 'Julio',
    'agosto': 'Agosto',
    'septiembre': 'Septiembre',
    'octubre': 'Octubre',
    'noviembre': 'Noviembre',
    'diciembre': 'Diciembre',
  };
  
  // Buscar el mes en el string
  for (const [mesKey, mesValue] of Object.entries(mesesMap)) {
    if (mesLower.includes(mesKey)) {
      // Extraer el año - buscar 4 dígitos (año completo) o 2 dígitos (año corto)
      let año = '';
      
      // Primero intentar encontrar año de 4 dígitos (2025, 2024, etc.)
      const año4Digitos = mesTrimmed.match(/\d{4}/);
      if (año4Digitos) {
        año = año4Digitos[0];
      } else {
        // Si no hay 4 dígitos, buscar 2 dígitos al final (25, 24, etc.)
        const año2Digitos = mesTrimmed.match(/(\d{2})$/);
        if (año2Digitos) {
          const añoCorto = parseInt(año2Digitos[1]);
          // Si es menor a 50, asumir 20XX, si es mayor, asumir 19XX
          año = añoCorto < 50 ? `20${año2Digitos[1]}` : `19${año2Digitos[1]}`;
        } else {
          // Si no hay año, usar el año actual
          año = new Date().getFullYear().toString();
        }
      }
      
      return `${mesValue} ${año}`;
    }
  }
  
  // Si no se encuentra ningún mes conocido, intentar extraer año y retornar normalizado
  const añoMatch = mesTrimmed.match(/\d{4}/) || mesTrimmed.match(/(\d{2})$/);
  if (añoMatch) {
    let año = '';
    if (añoMatch[0].length === 4) {
      año = añoMatch[0];
    } else {
      const añoCorto = parseInt(añoMatch[0]);
      año = añoCorto < 50 ? `20${añoMatch[0]}` : `19${añoMatch[0]}`;
    }
    // Retornar con el año pero sin el mes (mejor que nada)
    return `${mesTrimmed} ${año}`;
  }
  
  // Si no se encuentra nada, retornar el valor original normalizado
  return mesTrimmed;
}

/**
 * Normaliza la fecha de pago
 * Convierte diferentes formatos a formato estándar: "YYYY-MM-DD"
 */
function normalizeFechaPago(fecha: string): string | undefined {
  if (!fecha || fecha.trim() === '' || fecha.trim() === '-') return undefined;
  
  const fechaTrimmed = fecha.trim();
  
  // Si ya está en formato YYYY-MM-DD, retornarlo
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTrimmed)) {
    return fechaTrimmed;
  }
  
  // Intentar parsear diferentes formatos
  // Formato DD/MM/YYYY o DD-MM-YYYY
  const formato1 = fechaTrimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (formato1) {
    const [, dia, mes, año] = formato1;
    return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  // Formato YYYY/MM/DD o YYYY-MM-DD
  const formato2 = fechaTrimmed.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (formato2) {
    const [, año, mes, dia] = formato2;
    return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  // Si no se puede parsear, retornar undefined
  console.warn(`No se pudo normalizar la fecha: ${fechaTrimmed}`);
  return undefined;
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
          // Convertir valores numéricos (manejar valores vacíos o "-")
          const subtotalStr = (row.Subtotal || '').toString().replace(/,/g, '').trim();
          const ivaStr = (row.IVA || '').toString().replace(/,/g, '').trim();
          const totalStr = (row.Total || '').toString().replace(/,/g, '').trim();
          
          let subtotal = 0;
          let iva = 0;
          let total = 0;
          
          if (subtotalStr && subtotalStr !== '-' && subtotalStr !== '') {
            const parsed = parseFloat(subtotalStr);
            if (!isNaN(parsed)) subtotal = parsed;
          }
          
          if (ivaStr && ivaStr !== '-' && ivaStr !== '') {
            const parsed = parseFloat(ivaStr);
            if (!isNaN(parsed)) iva = parsed;
          }
          
          if (totalStr && totalStr !== '-' && totalStr !== '') {
            const parsed = parseFloat(totalStr);
            if (!isNaN(parsed)) total = parsed;
          }
          
          // Si total está vacío pero tenemos subtotal e IVA, calcularlo
          if (total === 0 && subtotal > 0) {
            total = subtotal + iva;
          }

          // Validar tipo (más flexible)
          const tipo = (row.Tipo || '').trim();
          if (tipo && tipo !== 'Variable' && tipo !== 'Fijo') {
            // Si no es válido, usar 'Variable' por defecto
            console.warn(`Tipo inválido en fila ${rowNumber}: "${tipo}". Usando "Variable" por defecto.`);
          }
          const tipoFinal = (tipo === 'Variable' || tipo === 'Fijo') ? tipo : 'Variable';

          // Validar status (más flexible)
          const status = (row.Status || '').trim();
          const validStatuses = ['Pagado', 'Pendiente', 'Cancelado'];
          if (status && !validStatuses.includes(status)) {
            // Si no es válido, usar 'Pendiente' por defecto
            console.warn(`Status inválido en fila ${rowNumber}: "${status}". Usando "Pendiente" por defecto.`);
          }
          const statusFinal = validStatuses.includes(status) ? status : 'Pendiente';

          // Validar campos mínimos requeridos
          if (!row.Concepto || row.Concepto.trim() === '') {
            throw new Error('El campo Concepto es requerido');
          }

          // Normalizar y limpiar todos los campos de texto
          const normalizeText = (value: string): string => {
            if (!value || value.trim() === '' || value.trim() === '-') return '';
            return value.trim();
          };

          // Crear objeto egreso con todos los campos normalizados
          const egresoData: Omit<Egreso, 'id'> = {
            lineaNegocio: normalizeText(row['Línea de negocio'] || ''),
            categoria: normalizeText(row.Categoría || ''),
            empresa: normalizeText(row.Empresa || ''),
            equipo: normalizeText(row.Equipo || ''),
            concepto: normalizeText(row.Concepto || ''),
            subtotal,
            iva,
            total,
            tipo: tipoFinal as 'Variable' | 'Fijo',
            mes: normalizeMes(normalizeText(row.Mes || '')),
            status: statusFinal as 'Pagado' | 'Pendiente' | 'Cancelado',
            tipoEgreso: 'basadoEnHoras',
            fechaPago: normalizeFechaPago(row['Fecha pago'] || ''),
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

