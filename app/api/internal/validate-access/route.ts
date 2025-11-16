import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken, hasInternalAccess } from '@/lib/firebase/admin-tech';

/**
 * Valida que el usuario tenga acceso interno
 * POST /api/internal/validate-access
 * Headers: Authorization: Bearer <idToken>
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verificar token con Admin SDK de visionaries-tech
    const decoded = await verifyIdToken(token);
    
    // Verificar que tenga acceso interno
    if (!decoded.internal) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'No internal access',
          message: 'Este usuario no tiene acceso a la plataforma interna'
        },
        { status: 403 }
      );
    }

    // Token válido y con acceso interno
    return NextResponse.json({
      valid: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role,
        internal: decoded.internal,
      }
    });
  } catch (error: any) {
    console.error('[Validate Access] Error:', error);
    
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
      { valid: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

