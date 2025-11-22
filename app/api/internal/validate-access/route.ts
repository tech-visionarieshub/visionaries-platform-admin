import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken, hasInternalAccess } from '@/lib/firebase/admin-tech';

/**
 * Valida que el usuario tenga acceso interno
 * POST /api/internal/validate-access
 * Headers: Authorization: Bearer <idToken>
 */
export async function POST(request: NextRequest) {
  console.log('[Validate Access API] ===== INICIO VALIDACIÓN =====')
  console.log('[Validate Access API] Timestamp:', new Date().toISOString())
  
  try {
    console.log('[Validate Access API] Paso 1: Extrayendo token del header...')
    const token = extractBearerToken(request);
    console.log('[Validate Access API] Paso 1.1: Token extraído:', token ? `Sí (length: ${token.length})` : 'No')
    
    if (!token) {
      console.log('[Validate Access API] ERROR: No token provided')
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    console.log('[Validate Access API] Paso 2: Verificando token con Admin SDK...')
    // Verificar token con Admin SDK de visionaries-tech
    const decoded = await verifyIdToken(token);
    console.log('[Validate Access API] Paso 2.1: Token verificado:', {
      uid: decoded.uid,
      email: decoded.email,
      internal: decoded.internal,
      role: decoded.role,
      superadmin: decoded.superadmin
    })
    
    console.log('[Validate Access API] Paso 3: Verificando acceso interno...')
    // Verificar que tenga acceso interno
    if (!decoded.internal) {
      console.log('[Validate Access API] ERROR: No internal access')
      return NextResponse.json(
        { 
          valid: false, 
          error: 'No internal access',
          message: 'Este usuario no tiene acceso a la plataforma interna'
        },
        { status: 403 }
      );
    }

    console.log('[Validate Access API] Paso 4: Verificando si es superadmin...')
    // Verificar si es superadmin
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    console.log('[Validate Access API] Paso 4.1: isSuperAdmin:', isSuperAdmin)

    console.log('[Validate Access API] Paso 5: Preparando respuesta exitosa...')
    // Token válido y con acceso interno
    const responseData = {
      valid: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role,
        internal: decoded.internal,
        superadmin: isSuperAdmin,
        allowedRoutes: decoded.allowedRoutes || [],
      }
    }
    console.log('[Validate Access API] Paso 5.1: Respuesta preparada:', responseData)
    console.log('[Validate Access API] ===== FIN VALIDACIÓN (ÉXITO) =====')
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[Validate Access API] ===== ERROR EN VALIDACIÓN =====')
    console.error('[Validate Access API] Error:', error);
    console.error('[Validate Access API] Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500)
    });
    
    // Error de configuración (falta service account)
    if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH')) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Configuration error',
          message: 'Falta configurar FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH en Vercel'
        },
        { status: 500 }
      );
    }
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { valid: false, error: 'Token expired' },
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Server error',
        message: error.message || 'Error desconocido al validar token'
      },
      { status: 500 }
    );
  }
}

