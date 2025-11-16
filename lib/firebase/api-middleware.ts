import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from './auth-helpers';
import { verifyIdToken } from './admin-tech';

/**
 * Middleware helper para proteger API Routes
 * Valida token y verifica acceso interno
 */
export async function validateInternalRequest(
  request: NextRequest
): Promise<{ valid: true; decoded: any } | { valid: false; response: NextResponse }> {
  const token = extractBearerToken(request);
  
  if (!token) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    };
  }

  try {
    const decoded = await verifyIdToken(token);
    
    if (!decoded.internal) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'No internal access' },
          { status: 403 }
        )
      };
    }

    return { valid: true, decoded };
  } catch (error: any) {
    console.error('[API Middleware] Error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        )
      };
    }
    
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    };
  }
}

