import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth, revokeInternalAccess } from '@/lib/firebase/admin-tech';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';

/**
 * Revoca el acceso interno de un usuario
 * POST /api/admin/revoke-internal-access
 * Body: { email: string } o { uid: string }
 * Headers: Authorization: Bearer <idToken>
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email, uid } = body;

    if (!email && !uid) {
      return NextResponse.json(
        { success: false, error: 'Email o UID es requerido' },
        { status: 400 }
      );
    }

    const auth = getAuraAuth();
    
    // Buscar usuario por email o UID
    let user;
    try {
      if (uid) {
        user = await auth.getUser(uid);
      } else {
        user = await auth.getUserByEmail(email);
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { success: false, error: `Usuario no encontrado: ${email || uid}` },
          { status: 404 }
        );
      }
      throw error;
    }

    // Revocar acceso interno
    await revokeInternalAccess(user.uid);

    return NextResponse.json({
      success: true,
      message: `Acceso interno revocado para ${user.email} (UID: ${user.uid})`,
      user: {
        uid: user.uid,
        email: user.email,
      },
      note: 'El usuario debe refrescar su token para que los cambios surtan efecto'
    });
  } catch (error: any) {
    console.error('[Revoke Internal Access] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error revocando acceso' },
      { status: 500 }
    );
  }
}



