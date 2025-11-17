import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth } from '@/lib/firebase/admin-tech';

/**
 * API Route temporal para asignar acceso interno a usuarios
 * POST /api/admin/assign-internal-access
 * Body: { email: string, role?: string }
 * 
 * IMPORTANTE: Esta ruta debería estar protegida en producción
 * Solo para uso administrativo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role = 'admin', allowedRoutes = [] } = body;

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

    // Asignar custom claims
    await auth.setCustomUserClaims(user.uid, {
      internal: true,
      role: role,
      allowedRoutes: Array.isArray(allowedRoutes) ? allowedRoutes : [],
    });

    return NextResponse.json({
      success: true,
      message: `Acceso interno asignado a ${email} (UID: ${user.uid}) con rol ${role}`,
      user: {
        uid: user.uid,
        email: user.email,
      },
      note: 'El usuario debe refrescar su token para que los cambios surtan efecto'
    });
  } catch (error: any) {
    console.error('[Assign Internal Access] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error asignando acceso' },
      { status: 500 }
    );
  }
}

