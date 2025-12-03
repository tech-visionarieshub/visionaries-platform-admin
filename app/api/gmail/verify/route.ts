import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { gmailService } from '@/lib/services/gmail-service';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = await verifyIdToken(token);
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    const hasInternalAccess = decoded.internal === true;

    // Permitir a superadmins o usuarios con acceso interno
    if (!isSuperAdmin && !hasInternalAccess) {
      return NextResponse.json(
        { error: 'Solo superadmins o usuarios con acceso interno pueden verificar Gmail' },
        { status: 403 }
      );
    }

    // Verificar conexión con Gmail
    const result = await gmailService.verifyConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Gmail Verify] Error:', error);
    return NextResponse.json(
      { 
        connected: false,
        error: error.message || 'Error al verificar conexión con Gmail' 
      },
      { status: 500 }
    );
  }
}




