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
// Usuarios autorizados para acceder a Finanzas
const FINANZAS_AUTHORIZED_EMAILS = [
  'arelyibarra@visionarieshub.com',
  'gabypino@visionarieshub.com'
];

/**
 * Verifica si un usuario tiene acceso a la sección de Finanzas
 */
export function hasFinanzasAccess(userEmail: string | undefined): boolean {
  if (!userEmail) return false;
  return FINANZAS_AUTHORIZED_EMAILS.includes(userEmail.toLowerCase());
}

export async function withAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
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

    const user: AuthenticatedUser = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
      internal: decoded.internal,
      superadmin: decoded.superadmin || decoded.email === 'adminplatform@visionarieshub.com',
      allowedRoutes: decoded.allowedRoutes || [],
    };

    return await handler(user, request);
  } catch (error: any) {
    console.error('[API Middleware] Error:', error);
    
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

/**
 * Middleware para proteger API routes de Finanzas
 * Valida token, verifica acceso interno Y verifica acceso a Finanzas
 */
export async function withFinanzasAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
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

    // Verificar acceso específico a Finanzas
    if (!hasFinanzasAccess(decoded.email)) {
      return NextResponse.json(
        { 
          error: 'Acceso denegado',
          message: 'No tienes permiso para acceder a la sección de Finanzas. Solo usuarios autorizados pueden acceder.'
        },
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

    return await handler(user, request);
  } catch (error: any) {
    console.error('[Finanzas API Middleware] Error:', error);
    
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

