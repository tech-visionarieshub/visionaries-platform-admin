import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth, setCustomUserClaims } from '@/lib/firebase/admin-tech';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';

/**
 * Actualiza el rol de un usuario con acceso interno
 * POST /api/admin/update-user-role
 * Body: { email: string, role: string } o { uid: string, role: string }
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
    const { email, uid, role, allowedRoutes } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Rol es requerido' },
        { status: 400 }
      );
    }

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

    // Verificar que el usuario tenga acceso interno
    if (!user.customClaims?.internal) {
      return NextResponse.json(
        { success: false, error: 'Este usuario no tiene acceso interno' },
        { status: 400 }
      );
    }

    // Actualizar rol manteniendo internal: true
    const updatedClaims: any = {
      internal: true,
      role: role,
    };
    
    // Si se proporcionan allowedRoutes, actualizarlos
    if (allowedRoutes !== undefined) {
      updatedClaims.allowedRoutes = Array.isArray(allowedRoutes) ? allowedRoutes : [];
    } else {
      // Mantener las rutas existentes si no se proporcionan nuevas
      updatedClaims.allowedRoutes = user.customClaims?.allowedRoutes || [];
    }
    
    await setCustomUserClaims(user.uid, updatedClaims);

    return NextResponse.json({
      success: true,
      message: `Rol actualizado para ${user.email} (UID: ${user.uid})`,
      user: {
        uid: user.uid,
        email: user.email,
        role: role,
      },
      note: 'El usuario debe refrescar su token para que los cambios surtan efecto'
    });
  } catch (error: any) {
    console.error('[Update User Role] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error actualizando rol' },
      { status: 500 }
    );
  }
}

