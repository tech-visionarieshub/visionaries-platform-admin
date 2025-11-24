import { NextRequest, NextResponse } from 'next/server';

// Importaciones dinámicas para evitar fallos al cargar el módulo si faltan variables de entorno
async function getDeps() {
  const { extractBearerToken } = await import('@/lib/firebase/auth-helpers');
  const { verifyIdToken } = await import('@/lib/firebase/admin-tech');
  const { getInternalFirestore } = await import('@/lib/firebase/admin-platform');
  return { extractBearerToken, verifyIdToken, getInternalFirestore };
}

export async function GET(request: NextRequest) {
  try {
    const { extractBearerToken, verifyIdToken, getInternalFirestore } = await getDeps();

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

    // Permitir a superadmins o usuarios con acceso interno
    if (!isSuperAdmin && !hasInternalAccess) {
      return NextResponse.json(
        { error: 'Solo superadmins o usuarios con acceso interno pueden acceder a esta configuración' },
        { status: 403 }
      );
    }

    // Obtener API key de Firestore
    const db = getInternalFirestore();
    const configDoc = await db.collection('config').doc('github').get();

    if (!configDoc.exists) {
      return NextResponse.json({
        configured: false,
        token: null,
      });
    }

    const data = configDoc.data();
    const apiToken = data?.token;

    // Enmascarar token (mostrar solo últimos 4 caracteres)
    const maskedToken = apiToken 
      ? `ghp_...${apiToken.slice(-4)}`
      : null;

    return NextResponse.json({
      configured: !!apiToken,
      token: maskedToken,
    });
  } catch (error: any) {
    console.error('[GitHub Config GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Cargar dependencias dinámicamente
    let deps;
    try {
      deps = await getDeps();
    } catch (e: any) {
      console.error('[GitHub Config POST] Error cargando dependencias:', e);
      return NextResponse.json(
        { error: 'Error interno: Fallo al cargar dependencias de Firebase. ' + e.message },
        { status: 500 }
      );
    }
    const { extractBearerToken, verifyIdToken, getInternalFirestore } = deps;
    
    // Verificar autenticación
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyIdToken(token);
    } catch (e: any) {
      console.error('[GitHub Config POST] Error verificando token:', e);
      return NextResponse.json(
        { error: 'Token inválido o expirado. ' + e.message },
        { status: 401 }
      );
    }
    
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    const hasInternalAccess = decoded.internal === true;

    // Permitir a superadmins o usuarios con acceso interno
    if (!isSuperAdmin && !hasInternalAccess) {
      console.error('[GitHub Config POST] Usuario sin permisos:', {
        email: decoded.email,
        superadmin: decoded.superadmin,
        internal: decoded.internal,
        isSuperAdmin,
        hasInternalAccess,
      });
      return NextResponse.json(
        { 
          error: 'Solo superadmins o usuarios con acceso interno pueden configurar GitHub',
          details: `Email: ${decoded.email}, Superadmin: ${decoded.superadmin}, Internal: ${decoded.internal}`
        },
        { status: 403 }
      );
    }

    // Obtener token del body
    const body = await request.json();
    const { token: githubToken } = body;

    if (!githubToken || typeof githubToken !== 'string') {
      return NextResponse.json(
        { error: 'Token de GitHub es requerido' },
        { status: 400 }
      );
    }

    // Validar formato básico de GitHub token (puede ser ghp_, github_pat_, etc.)
    if (!githubToken.startsWith('ghp_') && !githubToken.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Formato de token inválido. Debe comenzar con "ghp_" o "github_pat_"' },
        { status: 400 }
      );
    }

    // Validar token con GitHub API
    try {
      const validationResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!validationResponse.ok) {
        return NextResponse.json(
          { error: 'Token de GitHub inválido o sin permisos' },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error('[GitHub Config POST] Error validando token:', error);
      return NextResponse.json(
        { error: 'Error al validar token con GitHub: ' + error.message },
        { status: 500 }
      );
    }

    // Guardar en Firestore
    let db;
    try {
        db = getInternalFirestore();
    } catch (e: any) {
        console.error('[GitHub Config POST] Error obteniendo Firestore:', e);
        return NextResponse.json(
            { error: 'Error de configuración de base de datos: ' + e.message },
            { status: 500 }
        );
    }

    await db.collection('config').doc('github').set({
      token: githubToken,
      updatedAt: new Date(),
      updatedBy: decoded.email,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Token de GitHub guardado exitosamente',
    });
  } catch (error: any) {
    console.error('[GitHub Config POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}

