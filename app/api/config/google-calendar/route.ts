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

    // Obtener configuración de Firestore
    const db = getInternalFirestore();
    const configDoc = await db.collection('config').doc('googleCalendar').get();

    if (!configDoc.exists) {
      return NextResponse.json({
        configured: false,
        serviceAccountJson: null,
      });
    }

    const data = configDoc.data();
    const serviceAccountJson = data?.serviceAccountJson;

    // Enmascarar información sensible (mostrar solo project_id y client_email parcial)
    let maskedInfo = null;
    if (serviceAccountJson) {
      try {
        const json = typeof serviceAccountJson === 'string' 
          ? JSON.parse(serviceAccountJson) 
          : serviceAccountJson;
        const email = json.client_email || '';
        const maskedEmail = email ? `${email.split('@')[0]}@***` : '***';
        maskedInfo = {
          project_id: json.project_id || '***',
          client_email: maskedEmail,
        };
      } catch (e) {
        // Si no se puede parsear, solo indicar que está configurado
      }
    }

    return NextResponse.json({
      configured: !!serviceAccountJson,
      maskedInfo,
    });
  } catch (error: any) {
    console.error('[Google Calendar Config GET] Error:', error);
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
      console.error('[Google Calendar Config POST] Error cargando dependencias:', e);
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
      console.error('[Google Calendar Config POST] Error verificando token:', e);
      return NextResponse.json(
        { error: 'Token inválido o expirado. ' + e.message },
        { status: 401 }
      );
    }
    
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    const hasInternalAccess = decoded.internal === true;

    // Permitir a superadmins o usuarios con acceso interno
    if (!isSuperAdmin && !hasInternalAccess) {
      console.error('[Google Calendar Config POST] Usuario sin permisos:', {
        email: decoded.email,
        superadmin: decoded.superadmin,
        internal: decoded.internal,
        isSuperAdmin,
        hasInternalAccess,
      });
      return NextResponse.json(
        { 
          error: 'Solo superadmins o usuarios con acceso interno pueden configurar Google Calendar',
          details: `Email: ${decoded.email}, Superadmin: ${decoded.superadmin}, Internal: ${decoded.internal}`
        },
        { status: 403 }
      );
    }

    // Obtener Service Account JSON del body
    const body = await request.json();
    const { serviceAccountJson } = body;

    if (!serviceAccountJson || typeof serviceAccountJson !== 'string') {
      return NextResponse.json(
        { error: 'Service Account JSON es requerido' },
        { status: 400 }
      );
    }

    // Validar que sea un JSON válido
    let parsedJson;
    try {
      parsedJson = JSON.parse(serviceAccountJson);
    } catch (e) {
      return NextResponse.json(
        { error: 'Service Account JSON inválido. Debe ser un JSON válido.' },
        { status: 400 }
      );
    }

    // Validar campos requeridos del Service Account
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
    const missingFields = requiredFields.filter(field => !parsedJson[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: `Service Account JSON incompleto. Faltan campos: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validar que sea un Service Account
    if (parsedJson.type !== 'service_account') {
      return NextResponse.json(
        { error: 'El JSON proporcionado no es un Service Account válido (type debe ser "service_account")' },
        { status: 400 }
      );
    }

    // Guardar en Firestore
    let db;
    try {
        db = getInternalFirestore();
    } catch (e: any) {
        console.error('[Google Calendar Config POST] Error obteniendo Firestore:', e);
        return NextResponse.json(
            { error: 'Error de configuración de base de datos: ' + e.message },
            { status: 500 }
        );
    }

    await db.collection('config').doc('googleCalendar').set({
      serviceAccountJson: parsedJson, // Guardar como objeto, no como string
      updatedAt: new Date(),
      updatedBy: decoded.email,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Service Account de Google Calendar guardado exitosamente',
    });
  } catch (error: any) {
    console.error('[Google Calendar Config POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}

