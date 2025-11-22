import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth } from '@/lib/firebase/admin-tech';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';

/**
 * Asigna permisos de superadmin a un usuario
 * POST /api/admin/assign-superadmin
 * Body: { email: string }
 * Headers: Authorization: Bearer <idToken>
 * 
 * Solo usuarios superadmin pueden asignar superadmin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario que hace la petición sea superadmin
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const requesterDecoded = await verifyIdToken(token);
    const isRequesterSuperAdmin = requesterDecoded.email === 'adminplatform@visionarieshub.com' || requesterDecoded.superadmin === true;
    
    if (!isRequesterSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo superadmins pueden asignar permisos de superadmin' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const auth = getAuraAuth();
    
    // Buscar usuario por email
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { success: false, error: `Usuario no encontrado: ${email}` },
          { status: 404 }
        );
      }
      throw error;
    }

    // Obtener claims actuales y agregar superadmin
    const currentClaims = user.customClaims || {};
    
    // Asignar custom claims con superadmin
    await auth.setCustomUserClaims(user.uid, {
      ...currentClaims,
      internal: true,
      superadmin: true,
      role: currentClaims.role || 'admin',
      // Superadmin no necesita allowedRoutes, tiene acceso a todo
    });

    return NextResponse.json({
      success: true,
      message: `Permisos de superadmin asignados a ${email} (UID: ${user.uid})`,
      user: {
        uid: user.uid,
        email: user.email,
      },
      note: 'El usuario debe refrescar su token para que los cambios surtan efecto. Como superadmin, tiene acceso a todas las rutas (pasadas y futuras).'
    });
  } catch (error: any) {
    console.error('[Assign Superadmin] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error asignando permisos de superadmin' },
      { status: 500 }
    );
  }
}



