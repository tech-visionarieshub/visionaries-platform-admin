import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken, getAuraAuth } from '@/lib/firebase/admin-tech';

/**
 * Asigna custom claims a un usuario para darle acceso a la plataforma admin
 * POST /api/users/assign-access
 * 
 * Body: {
 *   email: string,
 *   role: "admin" | "user",
 *   superadmin?: boolean
 * }
 * 
 * Requiere: Usuario autenticado debe ser superadmin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario que hace la petición sea superadmin
    const token = extractBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verificar token del usuario que hace la petición
    const decoded = await verifyIdToken(token);
    
    // Solo superadmins pueden asignar acceso
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'Solo superadmins pueden asignar acceso a usuarios'
        },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { email, role = 'admin', superadmin = false } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Obtener Auth de visionaries-tech
    const auth = getAuraAuth();

    // Buscar usuario por email
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found',
            message: `Usuario con email ${email} no existe en Firebase Auth. Debe registrarse primero en Aura.`
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // Obtener claims actuales
    const currentClaims = user.customClaims || {};

    // Construir nuevos claims
    const newClaims = {
      ...currentClaims,
      internal: true,
      role: role,
      ...(superadmin && { superadmin: true }),
    };

    // Asignar claims
    await auth.setCustomUserClaims(user.uid, newClaims);

    console.log(`[Assign Access] Custom claims asignados a ${email} (${user.uid}):`, newClaims);

    return NextResponse.json({
      success: true,
      message: `Acceso asignado exitosamente a ${email}`,
      user: {
        uid: user.uid,
        email: user.email,
        claims: newClaims,
      },
      note: 'El usuario debe cerrar sesión y volver a iniciar sesión en Aura para que los cambios surtan efecto.'
    });
  } catch (error: any) {
    console.error('[Assign Access] Error:', error);
    
    // Error de configuración
    if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration error',
          message: 'Falta configurar FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH en Vercel'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error',
        message: error.message || 'Error desconocido al asignar acceso'
      },
      { status: 500 }
    );
  }
}


