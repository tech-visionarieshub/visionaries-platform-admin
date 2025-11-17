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
    return NextResponse.json(
      { success: false, error: error.message || 'Error listando usuarios' },
      { status: 500 }
    );
  }
}

