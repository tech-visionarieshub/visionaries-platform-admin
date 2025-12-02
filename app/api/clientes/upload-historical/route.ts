import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { clientesRepository } from '@/lib/repositories/clientes-repository';
import type { ClienteEntity } from '@/lib/repositories/clientes-repository';
import Papa from 'papaparse';

interface CSVRow {
  'Empresa': string;
  'Persona Cobranza': string;
  'Correo Cobranza': string;
  'CC Cobranza': string;
  'Cuenta de pago': string;
  'Datos de pago': string;
  'Razón Social': string;
  'RFC': string;
  'CP': string;
  'Fiscal Regime': string;
  'UsoCFDI': string;
  'Calle': string;
  'Colonia': string;
  'Localidad': string;
  'No. Exterior': string;
  'No. Interior': string;
  'Municipio': string;
  '# Municipio': string;
  'Estado': string;
  '# Estado': string;
  'Pais': string;
}

/**
 * Normaliza un valor del CSV: convierte "-" y strings vacíos a undefined
 */
function normalizeValue(value: string | undefined): string | undefined {
  if (!value || value.trim() === '' || value.trim() === '-') {
    return undefined;
  }
  return value.trim();
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
        'Empresa',
        'Persona Cobranza',
        'Correo Cobranza',
        'Cuenta de pago',
        'Datos de pago',
        'Razón Social',
        'RFC',
        'CP',
        'Fiscal Regime',
        'UsoCFDI',
        'Calle',
        'Colonia',
        'Localidad',
        'No. Exterior',
        'Municipio',
        'Estado',
        'Pais',
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
        skipped: 0,
        details: [] as Array<{ row: number; success: boolean; message: string; clienteId?: string }>,
      };

      // Procesar cada fila
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 porque la primera fila es el header y empezamos desde 1

        try {
          // Validar campos requeridos
          const empresa = normalizeValue(row.Empresa);
          const razonSocial = normalizeValue(row['Razón Social']);
          const rfc = normalizeValue(row.RFC);

          if (!empresa || !razonSocial || !rfc) {
            throw new Error('Empresa, Razón Social y RFC son campos requeridos');
          }

          // Verificar si el cliente ya existe (por RFC)
          const existingCliente = await clientesRepository.getByRfc(rfc);
          if (existingCliente) {
            results.skipped++;
            results.details.push({
              row: rowNumber,
              success: false,
              message: `Cliente con RFC ${rfc} ya existe`,
            });
            continue;
          }

          // Crear objeto cliente
          const clienteData: Omit<ClienteEntity, 'id' | 'createdAt' | 'updatedAt'> = {
            empresa: empresa,
            personaCobranza: normalizeValue(row['Persona Cobranza']) || '',
            correoCobranza: normalizeValue(row['Correo Cobranza']) || '',
            ccCobranza: normalizeValue(row['CC Cobranza']),
            cuentaPago: normalizeValue(row['Cuenta de pago']) || '',
            datosPago: normalizeValue(row['Datos de pago']) || '',
            razonSocial: razonSocial,
            rfc: rfc,
            cp: normalizeValue(row.CP) || '',
            regimenFiscal: normalizeValue(row['Fiscal Regime']) || '',
            usoCFDI: normalizeValue(row.UsoCFDI) || '',
            calle: normalizeValue(row.Calle) || '',
            colonia: normalizeValue(row.Colonia) || '',
            localidad: normalizeValue(row.Localidad) || '',
            noExterior: normalizeValue(row['No. Exterior']) || '',
            noInterior: normalizeValue(row['No. Interior']),
            municipio: normalizeValue(row.Municipio) || '',
            estado: normalizeValue(row.Estado) || '',
            pais: normalizeValue(row.Pais) || 'MÉXICO',
          };

          // Crear cliente
          const cliente = await clientesRepository.create(clienteData);

          results.success++;
          results.details.push({
            row: rowNumber,
            success: true,
            message: 'Cliente creado exitosamente',
            clienteId: cliente.id,
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
          skipped: results.skipped,
        },
        details: results.details,
      });
    } catch (error: any) {
      console.error('[Upload Clientes] Error:', error);
      return NextResponse.json(
        { error: 'Error procesando CSV', message: error.message },
        { status: 500 }
      );
    }
  });
}

