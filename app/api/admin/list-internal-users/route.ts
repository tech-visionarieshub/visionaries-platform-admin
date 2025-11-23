import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth } from '@/lib/firebase/admin-tech';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';

/**
 * Lista todos los usuarios con acceso interno (internal: true)
 * GET /api/admin/list-internal-users
 * Headers: Authorization: Bearer <idToken>
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario que hace la petición tenga acceso interno
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = await verifyIdToken(token);
    if (!decoded.internal) {
      return NextResponse.json(
        { error: 'No internal access' },
        { status: 403 }
      );
    }

    // Verificar que la variable de entorno esté configurada
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH) {
      console.error('[List Internal Users] FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no está configurado');
      return NextResponse.json(
        { 
          success: false, 
          error: 'FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no está configurado. Necesitas configurar esta variable de entorno para listar usuarios.' 
        },
        { status: 500 }
      );
    }

    const auth = getAuraAuth();
    
    // Listar todos los usuarios (Firebase Auth no tiene filtro directo por custom claims)
    // Necesitamos listar todos y filtrar
    const listUsersResult = await auth.listUsers(1000); // Máximo 1000 usuarios
    
    // Filtrar usuarios con internal: true
    const internalUsers = listUsersResult.users
      .filter(user => user.customClaims?.internal === true)
      .map(user => ({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        role: user.customClaims?.role || 'admin',
        allowedRoutes: user.customClaims?.allowedRoutes || [],
        internal: user.customClaims?.internal || false,
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
      }));

    return NextResponse.json({
      success: true,
      users: internalUsers,
      total: internalUsers.length,
    });
  } catch (error: any) {
    console.error('[List Internal Users] Error:', error);
    
    // Mensaje más descriptivo según el tipo de error
    let errorMessage = error.message || 'Error listando usuarios';
    if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH')) {
      errorMessage = 'FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no está configurado. Configura esta variable de entorno en .env.local para desarrollo local.';
    } else if (error.message?.includes('credential') || error.message?.includes('service account')) {
      errorMessage = 'Error al inicializar Firebase Admin SDK. Verifica que FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH sea un JSON válido.';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

