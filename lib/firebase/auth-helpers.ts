import { NextRequest } from 'next/server';

/**
 * Extrae el Bearer token del header Authorization
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.replace('Bearer ', '').trim();
}

/**
 * Tipo para decoded token con custom claims
 */
export interface DecodedTokenWithClaims {
  uid: string;
  email?: string;
  internal?: boolean;
  role?: string;
  [key: string]: any;
}




