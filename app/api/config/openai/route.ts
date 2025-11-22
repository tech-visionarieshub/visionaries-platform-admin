import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';

/**
 * API para gestionar la configuración de OpenAI
 * GET: Obtener API key (enmascarada)
 * POST: Guardar API key (solo superadmin)
 */

export async function GET(request: NextRequest) {
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

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo superadmins pueden acceder a esta configuración' },
        { status: 403 }
      );
    }

    // Obtener API key de Firestore
    const db = getInternalFirestore();
    const configDoc = await db.collection('config').doc('openai').get();

    if (!configDoc.exists) {
      return NextResponse.json({
        configured: false,
        apiKey: null,
      });
    }

    const data = configDoc.data();
    const apiKey = data?.apiKey;

    // Enmascarar API key (mostrar solo últimos 4 caracteres)
    const maskedKey = apiKey 
      ? `sk-...${apiKey.slice(-4)}`
      : null;

    return NextResponse.json({
      configured: !!apiKey,
      apiKey: maskedKey,
    });
  } catch (error: any) {
    console.error('[OpenAI Config] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo superadmins pueden configurar OpenAI' },
        { status: 403 }
      );
    }

    // Obtener API key del body
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key es requerida' },
        { status: 400 }
      );
    }

    // Validar formato básico de API key de OpenAI
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return NextResponse.json(
        { error: 'Formato de API key inválido. Debe comenzar con "sk-" y tener al menos 20 caracteres' },
        { status: 400 }
      );
    }

    // Guardar en Firestore
    const db = getInternalFirestore();
    await db.collection('config').doc('openai').set({
      apiKey,
      updatedAt: new Date(),
      updatedBy: decoded.email,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'API key de OpenAI guardada exitosamente',
    });
  } catch (error: any) {
    console.error('[OpenAI Config] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}


