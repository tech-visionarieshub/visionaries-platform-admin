import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';

/**
 * Ejemplo de API Route que accede a datos internos
 * GET /api/internal/dashboard
 * Headers: Authorization: Bearer <idToken>
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extraer token
    const token = extractBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // 2. Validar token con visionaries-tech
    const decoded = await verifyIdToken(token);
    
    // 3. Verificar acceso interno
    if (!decoded.internal) {
      return NextResponse.json(
        { error: 'No internal access' },
        { status: 403 }
      );
    }

    // 4. Acceder a Firestore de visionaries-platform-admin
    const db = getInternalFirestore();
    
    // Ejemplo: Obtener datos de una colección
    const snapshot = await db.collection('internalData').get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role,
      },
      data,
    });
  } catch (error: any) {
    console.error('[Dashboard API] Error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}



