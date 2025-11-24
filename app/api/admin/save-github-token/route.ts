import { NextRequest, NextResponse } from 'next/server';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';

/**
 * Endpoint temporal de administración para guardar el token de GitHub
 * Solo funciona en desarrollo o con una clave secreta
 * 
 * Uso: POST /api/admin/save-github-token
 * Body: { token: "ghp_...", secret?: "admin-secret" }
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'temporal-admin-secret-2025';

export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo o con secret
    const isDevelopment = process.env.NODE_ENV === 'development';
    const body = await request.json();
    const { token, secret } = body;

    if (!isDevelopment && secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere secret en producción.' },
        { status: 403 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      );
    }

    // Validar formato
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Formato de token inválido' },
        { status: 400 }
      );
    }

    // Validar token con GitHub API
    try {
      const validationResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!validationResponse.ok) {
        return NextResponse.json(
          { error: 'Token de GitHub inválido o sin permisos' },
          { status: 400 }
        );
      }

      const userData = await validationResponse.json();

      // Guardar en Firestore
      const db = getInternalFirestore();
      await db.collection('config').doc('github').set({
        token,
        updatedAt: new Date(),
        updatedBy: 'admin-endpoint',
        validatedUser: userData.login,
      }, { merge: true });

      return NextResponse.json({
        success: true,
        message: 'Token guardado exitosamente',
        user: userData.login,
      });
    } catch (error: any) {
      console.error('[Admin Save GitHub Token] Error:', error);
      return NextResponse.json(
        { error: 'Error al validar o guardar token: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Admin Save GitHub Token] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}

