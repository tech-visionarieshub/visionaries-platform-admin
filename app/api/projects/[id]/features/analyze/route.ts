import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { openAIService } from '@/lib/services/openai-service';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * API para analizar headers de archivos CSV/Excel con OpenAI para Features
 * POST /api/projects/[id]/features/analyze
 * 
 * Body: FormData con archivo (file)
 * 
 * Retorna: {headers, suggestedMappings, sampleRows}
 */

export interface FeatureColumnMapping {
  columnName: string
  mappedField: keyof {
    epicTitle: string
    title: string
    description: string
    priority: string
    assignee: string
    estimatedHours: number
    actualHours: number
    storyPoints: number
    sprint: string
  } | null
  confidence?: number
}

export interface FeatureAnalyzeFileResponse {
  headers: string[]
  suggestedMappings: FeatureColumnMapping[]
  sampleRows: Record<string, any>[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params en Next.js 15
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

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

    // Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
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

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Tamaño máximo: 10MB' },
        { status: 400 }
      );
    }

    let headers: string[] = [];
    let sampleRows: Record<string, any>[] = [];

    try {
      // Leer archivo según su tipo
      if (isCSV) {
        // Procesar CSV con papaparse
        const text = await file.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });

        if (parsed.errors.length > 0 && parsed.errors.some(e => e.type === 'Delimiter')) {
          // Intentar con diferentes delimitadores
          const parsed2 = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            transformHeader: (header) => header.trim(),
          });
          
          if (parsed2.errors.length < parsed.errors.length) {
            headers = Object.keys(parsed2.data[0] || {});
            sampleRows = (parsed2.data as any[]).slice(0, 5);
          } else {
            headers = Object.keys(parsed.data[0] || {});
            sampleRows = (parsed.data as any[]).slice(0, 5);
          }
        } else {
          headers = Object.keys(parsed.data[0] || {});
          sampleRows = (parsed.data as any[]).slice(0, 5);
        }
      } else {
        // Procesar Excel con xlsx
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) {
          return NextResponse.json(
            { error: 'El archivo Excel está vacío' },
            { status: 400 }
          );
        }

        // Primera fila son los headers
        headers = (jsonData[0] || []).map((h: any) => String(h).trim()).filter(Boolean);
        
        // Resto son las filas de datos
        sampleRows = jsonData.slice(1, 6).map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] || '';
          });
          return obj;
        });
      }

      if (headers.length === 0) {
        return NextResponse.json(
          { error: 'No se pudieron extraer headers del archivo' },
          { status: 400 }
        );
      }

      // Analizar headers con OpenAI (adaptado para Features)
      const analysisPromise = openAIService.analyzeCSVHeadersForFeatures(headers, sampleRows);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: El análisis tardó más de 30 segundos')), 30000);
      });

      const analysisResult = await Promise.race([analysisPromise, timeoutPromise]);

      return NextResponse.json({
        success: true,
        ...analysisResult,
      } as FeatureAnalyzeFileResponse & { success: boolean });
    } catch (error: any) {
      console.error('[Features Analyze] Error procesando archivo:', error);
      
      if (error.message?.includes('Timeout')) {
        return NextResponse.json(
          { error: 'El análisis tardó demasiado. Intenta con un archivo más pequeño o verifica tu conexión.' },
          { status: 408 }
        );
      }

      if (error.message?.includes('OpenAI')) {
        return NextResponse.json(
          { error: 'Error al analizar con OpenAI. Verifica que la API key esté configurada en Settings.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Error al procesar archivo: ${error.message || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Features Analyze] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido al analizar archivo' },
      { status: 500 }
    );
  }
}




