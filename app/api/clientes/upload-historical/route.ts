import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { clientesRepository } from '@/lib/repositories/clientes-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';
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

/**
 * Normaliza el nombre de empresa removiendo emojis
 */
function normalizeEmpresa(empresa: string): string {
  if (!empresa || empresa.trim() === '') return '';
  
  // Remover emojis y caracteres especiales al inicio
  const sinEmojis = empresa.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  
  // Remover espacios múltiples
  return sinEmojis.replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza correos electrónicos
 * - Remueve comas finales
 * - Limpia espacios
 * - Maneja múltiples correos separados por comas
 */
function normalizeEmail(email: string | undefined): string | undefined {
  if (!email || email.trim() === '' || email.trim() === '-') return undefined;
  
  let cleaned = email.trim();
  
  // Remover comas finales
  cleaned = cleaned.replace(/,\s*$/, '');
  
  // Limpiar espacios múltiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned || undefined;
}

/**
 * Normaliza el campo "Datos de pago"
 * - Convierte saltos de línea a espacios
 * - Limpia espacios múltiples
 * - Mantiene la información estructurada
 */
function normalizeDatosPago(datos: string | undefined): string {
  if (!datos || datos.trim() === '' || datos.trim() === '-') return '';
  
  // Reemplazar saltos de línea con espacios
  let normalized = datos.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');
  
  // Limpiar espacios múltiples
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Normaliza el Fiscal Regime completando el texto
 */
function normalizeFiscalRegime(regime: string | undefined): string {
  if (!regime || regime.trim() === '' || regime.trim() === '-') return '';
  
  const regimeMap: Record<string, string> = {
    '601': '601 - General de Ley Personas Morales',
    '612': '612 - Personas Físicas con Actividades Empresariales',
    '626': '626 - Régimen Simplificado de Confianza',
    '603': '603 - Personas Morales con Fines no Lucrativos',
    '605': '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios',
    '606': '606 - Arrendamiento',
    '608': '608 - Demás ingresos',
    '610': '610 - Residentes en el Extranjero sin Establecimiento Permanente en México',
    '611': '611 - Ingresos por Dividendos (socios y accionistas)',
    '614': '614 - Ingresos por obtención de premios',
    '615': '615 - Régimen de los ingresos por obtención de premios',
    '616': '616 - Sin obligaciones fiscales',
    '620': '620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
    '621': '621 - Incorporación Fiscal',
    '622': '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
    '623': '623 - Opcional para Grupos de Sociedades',
    '624': '624 - Coordinados',
    '625': '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
    '628': '628 - Hidrocarburos',
    '629': '629 - De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales',
    '630': '630 - Enajenación de acciones en bolsa de valores',
  };
  
  const regimeTrimmed = regime.trim();
  
  // Si ya tiene el texto completo, retornarlo
  if (regimeTrimmed.includes(' - ')) {
    return regimeTrimmed;
  }
  
  // Si es solo el número, buscar en el mapa
  if (regimeMap[regimeTrimmed]) {
    return regimeMap[regimeTrimmed];
  }
  
  // Si no se encuentra, retornar el valor original
  return regimeTrimmed;
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

      // Identificar empresas que tienen proyectos en la plataforma
      const allProjects = await projectsRepository.getAll();
      const empresasConProyectos = new Set(
        allProjects.map(p => p.client?.toLowerCase().trim()).filter(Boolean)
      );

      const results = {
        success: 0,
        errors: 0,
        skipped: 0,
        withProjects: 0,
        details: [] as Array<{ 
          row: number; 
          success: boolean; 
          message: string; 
          clienteId?: string;
          hasProjects?: boolean;
          empresa?: string;
        }>,
      };

      // Procesar cada fila
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 porque la primera fila es el header y empezamos desde 1

        try {
          // Normalizar y validar campos requeridos
          const empresaNormalizada = normalizeEmpresa(row.Empresa || '');
          const razonSocial = normalizeValue(row['Razón Social']);
          const rfc = normalizeValue(row.RFC);

          if (!empresaNormalizada || !razonSocial || !rfc) {
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

          // Crear objeto cliente con todas las normalizaciones
          const clienteData: Omit<ClienteEntity, 'id' | 'createdAt' | 'updatedAt'> = {
            empresa: empresaNormalizada,
            personaCobranza: normalizeValue(row['Persona Cobranza']) || '',
            correoCobranza: normalizeEmail(row['Correo Cobranza']) || '',
            ccCobranza: normalizeEmail(row['CC Cobranza']),
            cuentaPago: normalizeValue(row['Cuenta de pago']) || '',
            datosPago: normalizeDatosPago(row['Datos de pago']),
            razonSocial: razonSocial,
            rfc: rfc,
            cp: normalizeValue(row.CP) || '',
            regimenFiscal: normalizeFiscalRegime(row['Fiscal Regime']),
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

          // Verificar si la empresa tiene proyectos en la plataforma
          const tieneProyectos = empresasConProyectos.has(empresaNormalizada.toLowerCase());
          if (tieneProyectos) {
            results.withProjects++;
          }

          // Crear cliente
          const cliente = await clientesRepository.create(clienteData);

          results.success++;
          results.details.push({
            row: rowNumber,
            success: true,
            message: tieneProyectos 
              ? 'Cliente creado exitosamente (tiene proyectos en la plataforma)' 
              : 'Cliente creado exitosamente',
            clienteId: cliente.id,
            hasProjects: tieneProyectos,
            empresa: empresaNormalizada,
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
          withProjects: results.withProjects,
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

