import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { featuresRepository } from '@/lib/repositories/features-repository';
import type { Feature, FeaturePriority } from '@/types/feature';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import { openAIService } from '@/lib/services/openai-service';

type ProjectParamsContext = { params: Promise<{ id: string }> };

/**
 * API para upload bulk de Features desde CSV/Excel
 * POST /api/projects/[id]/features/upload
 * 
 * Body: FormData con:
 * - file: Archivo CSV/Excel
 * - mappings: JSON string con los mapeos de columnas [{columnName, mappedField, confidence}]
 * 
 * Retorna: { success: true, features: Feature[], count: number }
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
    let mappings: Array<{ columnName: string; mappedField: string | null; confidence?: number }>;
    try {
      const parsedMappings = JSON.parse(mappingsJson);
      const validated = uploadSchema.parse({ mappings: parsedMappings });
      mappings = validated.mappings;
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

      // Procesar cada fila y crear features
      const featuresToCreate: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      for (const row of rows) {
        const featureData: Partial<Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>> = {
          projectId: id,
          epicTitle: '',
          title: '',
          description: '',
          status: 'backlog',
          priority: 'medium' as FeaturePriority,
          createdBy: decoded.email || decoded.uid || 'unknown',
        };

        // Separar campos para criterios, comentarios, tipo, categoria y descripción
        const criteriaFields: string[] = []
        const commentFields: string[] = []
        const descriptionFields: string[] = []

        // Mapear cada columna a su campo correspondiente
        for (const [columnName, value] of Object.entries(row)) {
          const mappedField = columnToField.get(columnName);
          
          if (!mappedField || mappedField === null) {
            // Si no tiene mapeo, determinar dónde va según el nombre de la columna
            const stringValue = String(value || '').trim()
            if (stringValue) {
              const lowerColumnName = columnName.toLowerCase()
              // Columnas que parecen criterios de aceptación
              if (lowerColumnName.includes('criterio') || 
                  lowerColumnName.includes('aceptación') || 
                  lowerColumnName.includes('aceptacion') ||
                  lowerColumnName.includes('estado deseado') ||
                  lowerColumnName.includes('requisito') ||
                  lowerColumnName.includes('requirement')) {
                criteriaFields.push(stringValue)
              } 
              // Columnas que parecen comentarios
              else if (lowerColumnName.includes('comentario') || 
                       lowerColumnName.includes('nota') ||
                       lowerColumnName.includes('observación') ||
                       lowerColumnName.includes('observacion') ||
                       lowerColumnName.includes('note') ||
                       lowerColumnName.includes('comment')) {
                commentFields.push(stringValue)
              }
              // Resto va a descripción
              else {
                descriptionFields.push(`${columnName}: ${stringValue}`)
              }
            }
            continue;
          }

          const stringValue = String(value || '').trim();

          // Mapear según el campo
          switch (mappedField) {
            case 'epicTitle':
              featureData.epicTitle = stringValue;
              break;
            case 'title':
              featureData.title = stringValue;
              break;
            case 'description':
              descriptionFields.push(stringValue);
              break;
            case 'criteriosAceptacion':
              criteriaFields.push(stringValue);
              break;
            case 'comentarios':
              commentFields.push(stringValue);
              break;
            case 'tipo':
              // Validar que sea un tipo válido
              const validTypes = ['Funcionalidad', 'QA', 'Bug'];
              if (validTypes.includes(stringValue)) {
                featureData.tipo = stringValue as any;
              }
              break;
            case 'categoria':
              // Validar que sea una categoría válida
              const validCategories = ['Funcionalidad', 'QA', 'Bugs Generales', 'Otra'];
              if (validCategories.includes(stringValue)) {
                featureData.categoria = stringValue as any;
              }
              break;
            case 'priority':
              // Validar que sea una prioridad válida
              const validPriorities: FeaturePriority[] = ['high', 'medium', 'low'];
              if (validPriorities.includes(stringValue.toLowerCase() as FeaturePriority)) {
                featureData.priority = stringValue.toLowerCase() as FeaturePriority;
              }
              break;
            case 'assignee':
              featureData.assignee = stringValue;
              break;
            case 'estimatedHours':
              const estimatedHours = parseFloat(stringValue);
              if (!isNaN(estimatedHours)) {
                featureData.estimatedHours = estimatedHours;
              }
              break;
            case 'actualHours':
              const actualHours = parseFloat(stringValue);
              if (!isNaN(actualHours)) {
                featureData.actualHours = actualHours;
              }
              break;
            case 'storyPoints':
              const storyPoints = parseFloat(stringValue);
              if (!isNaN(storyPoints)) {
                featureData.storyPoints = storyPoints;
              }
              break;
            case 'sprint':
              featureData.sprint = stringValue;
              break;
            default:
              // Cualquier otro campo va a descripción
              if (stringValue) {
                descriptionFields.push(`${columnName}: ${stringValue}`);
              }
          }
        }

        // Agregar campos no mapeados a descripción
        if (descriptionFields.length > 0) {
          featureData.description = (featureData.description || '') + 
            (featureData.description ? '\n\n' : '') + 
            'Información adicional:\n' + descriptionFields.join('\n');
        }

        // Agregar criterios de aceptación detectados al campo separado
        if (criteriaFields.length > 0) {
          featureData.criteriosAceptacion = (featureData.criteriosAceptacion || '') + 
            (featureData.criteriosAceptacion ? '\n' : '') + 
            criteriaFields.join('\n');
        }

        // Agregar comentarios detectados al campo separado
        if (commentFields.length > 0) {
          featureData.comentarios = (featureData.comentarios || '') + 
            (featureData.comentarios ? '\n' : '') + 
            commentFields.join('\n');
        }

        // Validar que tenga epicTitle y title (requeridos)
        if (!featureData.epicTitle || featureData.epicTitle.trim() === '') {
          // Si no hay epicTitle, usar un valor por defecto o saltar esta fila
          console.warn(`Fila sin epicTitle, usando "Sin Epic" como valor por defecto`);
          featureData.epicTitle = 'Sin Epic';
        }

        if (!featureData.title || featureData.title.trim() === '') {
          // Si no hay título, usar la primera columna con valor o un ID generado
          const firstValue = Object.values(row).find(v => v && String(v).trim() !== '');
          featureData.title = firstValue ? String(firstValue).trim() : `Funcionalidad ${featuresToCreate.length + 1}`;
        }

        featuresToCreate.push(featureData as Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>);
      }

      if (featuresToCreate.length === 0) {
        return NextResponse.json(
          { error: 'No se pudieron crear funcionalidades desde el archivo' },
          { status: 400 }
        );
      }

      // Obtener nombre del proyecto para generar IDs
      const projectDoc = await getInternalFirestore().collection('projects').doc(id).get()
      const projectName = projectDoc.data()?.name

      // Estimar horas y prioridad con IA (en lotes de 10 para no saturar)
      console.log(`[Upload Features] Estimando ${featuresToCreate.length} features con IA...`)
      const batchSize = 10
      const estimatedFeatures: Array<Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>> = []

      for (let i = 0; i < featuresToCreate.length; i += batchSize) {
        const batch = featuresToCreate.slice(i, i + batchSize)
        try {
          const estimations = await openAIService.estimateFeatureDetails(
            batch.map(f => ({
              title: f.title,
              description: f.description,
              epicTitle: f.epicTitle,
              criteriosAceptacion: f.criteriosAceptacion,
            }))
          )

          // Aplicar estimaciones a cada feature del batch
          batch.forEach((feature, idx) => {
            const estimation = estimations[idx]
            if (estimation) {
              feature.estimatedHours = estimation.estimatedHours
              feature.priority = estimation.priority
            }
          })

          estimatedFeatures.push(...batch)
        } catch (error: any) {
          console.error(`[Upload Features] Error estimando batch ${i / batchSize + 1}:`, error)
          // Continuar sin estimación si falla
          estimatedFeatures.push(...batch)
        }
      }

      // Crear features en batch con estimaciones
      const createdFeatures = await featuresRepository.createBatch(id, estimatedFeatures, projectName);

      return NextResponse.json({
        success: true,
        features: createdFeatures,
        count: createdFeatures.length,
      }, { status: 201 });
    } catch (error: any) {
      console.error('[Features Upload] Error procesando archivo:', error);
      return NextResponse.json(
        { error: `Error al procesar archivo: ${error.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Features Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido al subir archivo' },
      { status: 500 }
    );
  }
}

