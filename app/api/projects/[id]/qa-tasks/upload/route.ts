import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { qaTasksRepository } from '@/lib/repositories/qa-tasks-repository';
import type { QATask, QATaskCategory, QATaskStatus, CSVColumnMapping } from '@/types/qa';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';

type ProjectParamsContext = { params: Promise<{ id: string }> };

/**
 * API para upload bulk de tareas QA desde CSV/Excel
 * POST /api/projects/[id]/qa-tasks/upload
 * 
 * Body: FormData con:
 * - file: Archivo CSV/Excel
 * - mappings: JSON string con los mapeos de columnas [{columnName, mappedField, confidence}]
 * 
 * Retorna: { success: true, tasks: QATask[], count: number }
 */

const uploadSchema = z.object({
  mappings: z.array(z.object({
    columnName: z.string(),
    mappedField: z.string().nullable(),
    confidence: z.number().optional(),
  })),
});

export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params;

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

    // Obtener archivo y mappings del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mappingsJson = formData.get('mappings') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!mappingsJson) {
      return NextResponse.json(
        { error: 'No se proporcionaron los mapeos de columnas' },
        { status: 400 }
      );
    }

    // Validar mappings
    let mappings: CSVColumnMapping[];
    try {
      const parsedMappings = JSON.parse(mappingsJson);
      const validated = uploadSchema.parse({ mappings: parsedMappings });
      mappings = validated.mappings as CSVColumnMapping[];
    } catch (error: any) {
      return NextResponse.json(
        { error: `Mapeos inválidos: ${error.message}` },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { error: 'Formato de archivo no soportado. Solo se aceptan CSV o Excel (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    try {
      let rows: Record<string, any>[] = [];

      // Leer archivo según su tipo
      if (isCSV) {
        const text = await file.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length > 0 && parsed.errors.some(e => e.type === 'Delimiter')) {
          // Intentar con punto y coma
          const parsed2 = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            transformHeader: (header) => header.trim(),
          });
          
          if (parsed2.errors.length < parsed.errors.length) {
            rows = parsed2.data as Record<string, any>[];
          } else {
            rows = parsed.data as Record<string, any>[];
          }
        } else {
          rows = parsed.data as Record<string, any>[];
        }
      } else {
        // Procesar Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          return NextResponse.json(
            { error: 'El archivo Excel está vacío' },
            { status: 400 }
          );
        }

        // Primera fila son los headers
        const headers = (jsonData[0] || []).map((h: any) => String(h).trim()).filter(Boolean);
        
        // Resto son las filas de datos
        rows = jsonData.slice(1).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] || '';
          });
          return obj;
        });
      }

      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'El archivo no contiene datos' },
          { status: 400 }
        );
      }

      // Crear mapeo inverso: columnName -> mappedField
      const columnToField = new Map<string, string | null>();
      mappings.forEach(mapping => {
        columnToField.set(mapping.columnName, mapping.mappedField);
      });

      // Procesar cada fila y crear tareas
      const tasksToCreate: Omit<QATask, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      for (const row of rows) {
        const taskData: Partial<Omit<QATask, 'id' | 'createdAt' | 'updatedAt'>> = {
          titulo: '',
          categoria: 'Otra' as QATaskCategory,
          tipo: '',
          criterios_aceptacion: '',
          comentarios: '',
          estado: 'Pendiente' as QATaskStatus,
          imagenes: [],
          createdBy: decoded.email || decoded.uid || 'unknown',
          projectId: id,
        };

        // Mapear cada columna a su campo correspondiente
        for (const [columnName, value] of Object.entries(row)) {
          const mappedField = columnToField.get(columnName);
          
          if (!mappedField || mappedField === null) {
            // Si no tiene mapeo, agregar a comentarios
            if (value && String(value).trim() !== '') {
              taskData.comentarios = (taskData.comentarios || '') + 
                (taskData.comentarios ? ' | ' : '') + 
                `${columnName}: ${String(value).trim()}`;
            }
            continue;
          }

          const stringValue = String(value || '').trim();

          // Mapear según el campo
          switch (mappedField) {
            case 'titulo':
              taskData.titulo = stringValue;
              break;
            case 'categoria':
              // Validar que sea una categoría válida
              const validCategories: QATaskCategory[] = ['Funcionalidades Nuevas', 'QA', 'Bugs Generales', 'Otra'];
              if (validCategories.includes(stringValue as QATaskCategory)) {
                taskData.categoria = stringValue as QATaskCategory;
              } else {
                taskData.categoria = 'Otra';
                taskData.comentarios = (taskData.comentarios || '') + 
                  (taskData.comentarios ? ' | ' : '') + 
                  `Categoría original: ${stringValue}`;
              }
              break;
            case 'tipo':
              taskData.tipo = stringValue;
              break;
            case 'criterios_aceptacion':
              taskData.criterios_aceptacion = stringValue;
              break;
            case 'estado':
              // Validar que sea un estado válido
              const validStatuses: QATaskStatus[] = ['Pendiente', 'En Progreso', 'Completado', 'Bloqueado', 'Cancelado'];
              if (validStatuses.includes(stringValue as QATaskStatus)) {
                taskData.estado = stringValue as QATaskStatus;
              }
              break;
            case 'comentarios':
              taskData.comentarios = (taskData.comentarios || '') + 
                (taskData.comentarios ? ' | ' : '') + 
                stringValue;
              break;
            case 'id':
              // Ignorar el ID, se generará automáticamente
              break;
            default:
              // Cualquier otro campo va a comentarios
              if (stringValue) {
                taskData.comentarios = (taskData.comentarios || '') + 
                  (taskData.comentarios ? ' | ' : '') + 
                  `${columnName}: ${stringValue}`;
              }
          }
        }

        // Validar que al menos tenga título
        if (!taskData.titulo || taskData.titulo.trim() === '') {
          // Si no hay título, usar la primera columna con valor o un ID generado
          const firstValue = Object.values(row).find(v => v && String(v).trim() !== '');
          taskData.titulo = firstValue ? String(firstValue).trim() : `Tarea ${tasksToCreate.length + 1}`;
        }

        tasksToCreate.push(taskData as Omit<QATask, 'id' | 'createdAt' | 'updatedAt'>);
      }

      if (tasksToCreate.length === 0) {
        return NextResponse.json(
          { error: 'No se pudieron crear tareas desde el archivo' },
          { status: 400 }
        );
      }

      // Crear tareas en batch
      const createdTasks = await qaTasksRepository.createBatch(id, tasksToCreate);

      return NextResponse.json({
        success: true,
        tasks: createdTasks,
        count: createdTasks.length,
      }, { status: 201 });
    } catch (error: any) {
      console.error('[Bulk Upload] Error procesando archivo:', error);
      return NextResponse.json(
        { error: `Error al procesar archivo: ${error.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Bulk Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido al subir archivo' },
      { status: 500 }
    );
  }
}


