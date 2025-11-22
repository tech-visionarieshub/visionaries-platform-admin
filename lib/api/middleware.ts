import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
  internal: boolean;
  superadmin?: boolean;
  allowedRoutes?: string[];
}

/**
 * Middleware para proteger API routes
 * Valida token y verifica acceso interno
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    console.log('[API Middleware] Iniciando validación de autenticación');
    const token = extractBearerToken(request);
    
    if (!token) {
      console.log('[API Middleware] No token provided');
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    console.log('[API Middleware] Token extraído, verificando...');
    const decoded = await verifyIdToken(token);
    console.log('[API Middleware] Token verificado, email:', decoded.email);
    
    if (!decoded.internal) {
      console.log('[API Middleware] Usuario no tiene acceso interno');
      return NextResponse.json(
        { error: 'No internal access' },
        { status: 403 }
      );
    }

    const user: AuthenticatedUser = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
      internal: decoded.internal,
      superadmin: decoded.superadmin || decoded.email === 'adminplatform@visionarieshub.com',
      allowedRoutes: decoded.allowedRoutes || [],
    };

    console.log('[API Middleware] Usuario autorizado, ejecutando handler');
    return await handler(user, request);
  } catch (error: any) {
    console.error('[API Middleware] Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    if (error.code === 'auth/id-token-expired' || error.message?.includes('expired')) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }
    
    if (error.code === 'auth/argument-error' || error.message?.includes('invalid')) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication error', message: error.message },
      { status: 500 }
    );
  }
}

