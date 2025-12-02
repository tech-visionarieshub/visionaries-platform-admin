import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { egresosRepository, type EgresoEntity } from '@/lib/repositories/egresos-repository';
import { clientesRepository, type ClienteEntity } from '@/lib/repositories/clientes-repository';
import { projectsRepository, type ProjectEntity } from '@/lib/repositories/projects-repository';
import { extractGoogleDriveFileId, downloadFileFromGoogleDrive, isValidGoogleDriveUrl, getMimeTypeFromFileName } from '@/lib/utils/google-drive-utils';
import { uploadFileToStorage } from '@/lib/utils/storage-utils';
import { normalizeEmpresa, normalizeEmpresaForMatching } from '@/lib/utils/normalize-empresa';
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
  
  // Formato DD-MMM-YYYY (ej: "15-ene-2024")
  const formato3 = fechaTrimmed.match(/(\d{1,2})[\-](\w{3})[\-](\d{4})/i);
  if (formato3) {
    const [, dia, mesStr, año] = formato3;
    const mesesMap: Record<string, string> = {
      'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12',
    };
    const mes = mesesMap[mesStr.toLowerCase()];
    if (mes) {
      return `${año}-${mes}-${dia.padStart(2, '0')}`;
    }
  }
  
  // Si no se puede parsear, retornar undefined
  console.warn(`No se pudo normalizar la fecha: ${fechaTrimmed}`);
  return undefined;
}

/**
 * Busca un cliente por empresa normalizada (case-insensitive, matching flexible)
 * Estrategia de matching:
 * 0. Reglas especiales por defecto (empresas específicas)
 * 1. Match exacto (case-insensitive)
 * 2. Match parcial (una contiene a la otra, mínimo 3 caracteres)
 * 3. Match por palabras clave (si ambas tienen al menos una palabra común de 3+ caracteres)
 */
function matchEmpresaWithCliente(
  empresaNormalizada: string,
  clientes: ClienteEntity[]
): ClienteEntity | null {
  if (!empresaNormalizada) return null;
  
  const empresaMatch = normalizeEmpresaForMatching(empresaNormalizada);
  
  // 0. Reglas especiales por defecto
  // Si es "✨ VISIONARIES HUB" o variaciones, buscar "Visionaries Hub"
  if (empresaMatch.includes('visionaries') && empresaMatch.includes('hub')) {
    const visionariesCliente = clientes.find(c => {
      const clienteMatch = normalizeEmpresaForMatching(c.empresa);
      return clienteMatch.includes('visionaries') && clienteMatch.includes('hub');
    });
    if (visionariesCliente) {
      return visionariesCliente;
    }
  }
  
  // Si es "SGAC", buscar "Invomex"
  if (empresaMatch === 'sgac' || empresaMatch.includes('sgac')) {
    const invomexCliente = clientes.find(c => {
      const clienteMatch = normalizeEmpresaForMatching(c.empresa);
      return clienteMatch === 'invomex' || clienteMatch.includes('invomex');
    });
    if (invomexCliente) {
      return invomexCliente;
    }
  }
  
  // 1. Buscar match exacto (case-insensitive)
  for (const cliente of clientes) {
    const clienteEmpresaMatch = normalizeEmpresaForMatching(cliente.empresa);
    if (clienteEmpresaMatch === empresaMatch) {
      return cliente;
    }
  }
  
  // 2. Buscar match parcial (una contiene a la otra, mínimo 3 caracteres para evitar matches falsos)
  if (empresaMatch.length >= 3) {
    for (const cliente of clientes) {
      const clienteEmpresaMatch = normalizeEmpresaForMatching(cliente.empresa);
      if (clienteEmpresaMatch.length >= 3) {
        if (
          empresaMatch.includes(clienteEmpresaMatch) ||
          clienteEmpresaMatch.includes(empresaMatch)
        ) {
          return cliente;
        }
      }
    }
  }
  
  // 3. Match por palabras clave (palabras de 3+ caracteres)
  const palabrasEmpresa = empresaMatch.split(/\s+/).filter(p => p.length >= 3);
  if (palabrasEmpresa.length > 0) {
    for (const cliente of clientes) {
      const clienteEmpresaMatch = normalizeEmpresaForMatching(cliente.empresa);
      const palabrasCliente = clienteEmpresaMatch.split(/\s+/).filter(p => p.length >= 3);
      
      // Si hay al menos una palabra común
      const palabrasComunes = palabrasEmpresa.filter(p => palabrasCliente.includes(p));
      if (palabrasComunes.length > 0) {
        return cliente;
      }
    }
  }
  
  return null;
}

/**
 * Busca proyectos asociados a una empresa
 */
function findProyectosForEmpresa(
  empresaNormalizada: string,
  clienteId: string | undefined,
  proyectosPorClienteId: Map<string, ProjectEntity[]>,
  proyectosPorNombreCliente: Map<string, ProjectEntity[]>
): string[] {
  const proyectoIds: string[] = [];
  
  // Si hay clienteId, buscar proyectos por clientId
  if (clienteId) {
    const proyectos = proyectosPorClienteId.get(clienteId) || [];
    proyectoIds.push(...proyectos.map(p => p.id));
  }
  
  // Buscar proyectos por nombre de cliente (normalizado)
  const empresaMatch = normalizeEmpresaForMatching(empresaNormalizada);
  for (const [clientName, proyectos] of proyectosPorNombreCliente.entries()) {
    const clientNameMatch = normalizeEmpresaForMatching(clientName);
    if (clientNameMatch === empresaMatch || clientNameMatch.includes(empresaMatch) || empresaMatch.includes(clientNameMatch)) {
      proyectoIds.push(...proyectos.map(p => p.id));
    }
  }
  
  // Eliminar duplicados
  return Array.from(new Set(proyectoIds));
}

/**
 * Crea un hash único para detectar duplicados
 */
function createEgresoHash(egreso: {
  empresaNormalizada: string;
  concepto: string;
  mes: string;
  fechaPago?: string;
}): string {
  const fecha = egreso.fechaPago || '';
  return `${egreso.empresaNormalizada}|${egreso.concepto}|${egreso.mes}|${fecha}`;
}

/**
 * Encuentra un egreso duplicado
 */
function findDuplicateEgreso(
  egresoData: {
    empresaNormalizada: string;
    concepto: string;
    mes: string;
    fechaPago?: string;
  },
  existingEgresos: EgresoEntity[]
): EgresoEntity | null {
  const hash = createEgresoHash(egresoData);
  const hashMatch = normalizeEmpresaForMatching(egresoData.empresaNormalizada);
  
  for (const egreso of existingEgresos) {
    const existingHash = createEgresoHash({
      empresaNormalizada: egreso.empresaNormalizada || egreso.empresa,
      concepto: egreso.concepto,
      mes: egreso.mes,
      fechaPago: egreso.fechaPago,
    });
    
    // Match exacto
    if (existingHash === hash) {
      return egreso;
    }
    
    // Match con diferencia de fecha < 3 días
    if (
      egresoData.concepto === egreso.concepto &&
      egresoData.mes === egreso.mes &&
      normalizeEmpresaForMatching(egreso.empresaNormalizada || egreso.empresa) === hashMatch &&
      egresoData.fechaPago &&
      egreso.fechaPago
    ) {
      const fecha1 = new Date(egresoData.fechaPago);
      const fecha2 = new Date(egreso.fechaPago);
      const diffDays = Math.abs((fecha1.getTime() - fecha2.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        return egreso;
      }
    }
  }
  
  return null;
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

      // Cargar todos los datos necesarios UNA VEZ al inicio
      console.log('[Upload Historical] Cargando datos de referencia...');
      const [clientes, proyectos, egresosExistentes] = await Promise.all([
        clientesRepository.getAll(),
        projectsRepository.getAll(),
        egresosRepository.getAll(),
      ]);
      
      console.log(`[Upload Historical] Cargados: ${clientes.length} clientes, ${proyectos.length} proyectos, ${egresosExistentes.length} egresos existentes`);
      
      // Crear mapas/indexes para búsqueda rápida
      const clientesMap = new Map<string, ClienteEntity>();
      for (const cliente of clientes) {
        const empresaNormalizada = normalizeEmpresaForMatching(cliente.empresa);
        if (!clientesMap.has(empresaNormalizada)) {
          clientesMap.set(empresaNormalizada, cliente);
        }
      }
      
      const proyectosPorClienteId = new Map<string, ProjectEntity[]>();
      const proyectosPorNombreCliente = new Map<string, ProjectEntity[]>();
      for (const proyecto of proyectos) {
        // Por clientId
        if (proyecto.clientId) {
          if (!proyectosPorClienteId.has(proyecto.clientId)) {
            proyectosPorClienteId.set(proyecto.clientId, []);
          }
          proyectosPorClienteId.get(proyecto.clientId)!.push(proyecto);
        }
        
        // Por nombre de cliente
        if (proyecto.client) {
          const clientNameMatch = normalizeEmpresaForMatching(proyecto.client);
          if (!proyectosPorNombreCliente.has(clientNameMatch)) {
            proyectosPorNombreCliente.set(clientNameMatch, []);
          }
          proyectosPorNombreCliente.get(clientNameMatch)!.push(proyecto);
        }
      }
      
      // Mapa de egresos existentes para detección de duplicados
      const egresosMap = new Map<string, EgresoEntity>();
      for (const egreso of egresosExistentes) {
        const hash = createEgresoHash({
          empresaNormalizada: egreso.empresaNormalizada || egreso.empresa,
          concepto: egreso.concepto,
          mes: egreso.mes,
          fechaPago: egreso.fechaPago,
        });
        egresosMap.set(hash, egreso);
      }

      const results = {
        success: 0,
        errors: 0,
        created: 0,
        updated: 0,
        withCliente: 0,
        withProyectos: 0,
        empresasSinCliente: new Set<string>(),
        empresasSinConexion: new Set<string>(),
        details: [] as Array<{ row: number; success: boolean; message: string; egresoId?: string; updated?: boolean }>,
      };

      // Procesar cada fila
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // +2 porque la primera fila es el header y empezamos desde 1

        try {
          // Convertir valores numéricos (manejar valores vacíos, "-", "$", comas, espacios)
          const parseMonetaryValue = (value: string): number => {
            if (!value || value === '-' || value === '') return 0;
            // Remover $, comas, espacios y otros caracteres no numéricos excepto punto y guión
            const cleaned = value.toString()
              .replace(/\$/g, '') // Remover símbolo de dólar
              .replace(/,/g, '') // Remover comas
              .replace(/\s/g, '') // Remover espacios
              .trim();
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
          };
          
          let subtotal = parseMonetaryValue(row.Subtotal || '');
          let iva = parseMonetaryValue(row.IVA || '');
          let total = parseMonetaryValue(row.Total || '');
          
          // Si total está vacío pero tenemos subtotal e IVA, calcularlo
          if (total === 0 && subtotal > 0) {
            total = subtotal + iva;
          }
          
          // Si subtotal está vacío pero tenemos total e IVA, calcularlo
          if (subtotal === 0 && total > 0 && iva > 0) {
            subtotal = total - iva;
          }
          
          // Si IVA está vacío pero tenemos total y subtotal, calcularlo
          if (iva === 0 && total > 0 && subtotal > 0) {
            iva = total - subtotal;
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

          // Normalizar empresa (remover emojis)
          const empresaOriginal = normalizeText(row.Empresa || '');
          const empresaNormalizada = normalizeEmpresa(empresaOriginal);
          const empresaMatch = normalizeEmpresaForMatching(empresaNormalizada);

          // Buscar cliente
          let clienteId: string | undefined;
          let proyectoIds: string[] = [];
          
          try {
            const cliente = matchEmpresaWithCliente(empresaNormalizada, clientes);
            if (cliente) {
              clienteId = cliente.id;
              results.withCliente++;
            } else {
              results.empresasSinCliente.add(empresaNormalizada);
            }
            
            // Buscar proyectos
            proyectoIds = findProyectosForEmpresa(
              empresaNormalizada,
              clienteId,
              proyectosPorClienteId,
              proyectosPorNombreCliente
            );
            
            if (proyectoIds.length > 0) {
              results.withProyectos++;
            } else if (!clienteId) {
              results.empresasSinConexion.add(empresaNormalizada);
            }
          } catch (error: any) {
            console.error(`Error en vinculación para fila ${rowNumber}:`, error);
            // Continuar aunque falle la vinculación
          }

          // Crear objeto egreso con todos los campos normalizados
          const egresoData: Omit<Egreso, 'id'> = {
            lineaNegocio: normalizeText(row['Línea de negocio'] || ''),
            categoria: normalizeText(row.Categoría || ''),
            empresa: empresaOriginal, // Mantener original para referencia
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
            // Campos de interconexión
            empresaNormalizada,
            clienteId,
            proyectoIds: proyectoIds.length > 0 ? proyectoIds : undefined,
          };

          // Verificar si existe duplicado
          const duplicate = findDuplicateEgreso(
            {
              empresaNormalizada,
              concepto: egresoData.concepto,
              mes: egresoData.mes,
              fechaPago: egresoData.fechaPago,
            },
            egresosExistentes
          );

          let egreso: EgresoEntity;
          let egresoId: string;
          let isUpdate = false;

          if (duplicate) {
            // Actualizar egreso existente
            isUpdate = true;
            egresoId = duplicate.id;
            
            // Preservar archivos existentes si no se proporcionan nuevos
            const updates: Partial<EgresoEntity> = {
              ...egresoData,
              // Preservar archivos si ya existen y no se están actualizando
              facturaUrl: duplicate.facturaUrl || egresoData.facturaUrl,
              comprobanteUrl: duplicate.comprobanteUrl || egresoData.comprobanteUrl,
              facturaFileName: duplicate.facturaFileName || egresoData.facturaFileName,
              comprobanteFileName: duplicate.comprobanteFileName || egresoData.comprobanteFileName,
              // Preservar conexiones existentes si no se encontraron nuevas
              clienteId: egresoData.clienteId || duplicate.clienteId,
              proyectoIds: egresoData.proyectoIds || duplicate.proyectoIds,
            };
            
            egreso = await egresosRepository.update(egresoId, updates);
            results.updated++;
          } else {
            // Crear nuevo egreso
            egreso = await egresosRepository.create(egresoData);
            egresoId = egreso.id;
            results.created++;
            // Agregar a la lista de egresos existentes para evitar duplicados en el mismo batch
            egresosExistentes.push(egreso);
          }

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
            message: isUpdate ? 'Egreso actualizado exitosamente (duplicado encontrado)' : 'Egreso creado exitosamente',
            egresoId,
            updated: isUpdate,
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
          created: results.created,
          updated: results.updated,
          withCliente: results.withCliente,
          withProyectos: results.withProyectos,
          empresasSinCliente: Array.from(results.empresasSinCliente),
          empresasSinConexion: Array.from(results.empresasSinConexion),
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

