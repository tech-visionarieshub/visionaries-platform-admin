import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth } from '@/lib/firebase/admin-tech';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';

/**
 * Revisa el estado completo de un usuario en el sistema
 * GET /api/admin/revisar-usuario?email=usuario@example.com
 * Headers: Authorization: Bearer <idToken>
 * 
 * Solo usuarios superadmin pueden revisar usuarios
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario que hace la petición sea superadmin
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = await verifyIdToken(token);
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo superadmins pueden revisar usuarios' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    const auth = getAuraAuth();
    
    // 1. Verificar en Firebase Auth
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({
          exists: false,
          firebaseAuth: {
            found: false,
            message: 'Usuario no encontrado en Firebase Auth'
          },
          customClaims: null,
          firestore: null,
          summary: {
            hasAccess: false,
            missing: ['Usuario no existe en Firebase Auth']
          }
        });
      }
      throw error;
    }

    // 2. Obtener Custom Claims
    const claims = user.customClaims || {};
    const hasInternal = claims.internal === true;
    const hasRole = !!claims.role;
    const isSuperAdminUser = claims.superadmin === true;

    // 3. Verificar hasPortalAdminAccess en Firestore
    let firestoreData = null;
    try {
      const db = getInternalFirestore();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        firestoreData = {
          found: true,
          documentId: userDoc.id,
          hasPortalAdminAccess: userData.hasPortalAdminAccess === true,
          isActive: userData.isActive === true,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        };
      } else {
        firestoreData = {
          found: false,
          hasPortalAdminAccess: false,
        };
      }
    } catch (error: any) {
      firestoreData = {
        found: false,
        error: error.message,
      };
    }

    // 4. Resumen
    const missing = [];
    if (!hasInternal) missing.push('internal: true (Custom Claim)');
    if (!hasRole) missing.push('role: "admin" (Custom Claim)');
    if (!firestoreData?.hasPortalAdminAccess) missing.push('hasPortalAdminAccess: true (Firestore)');

    const hasAccess = hasInternal && hasRole && firestoreData?.hasPortalAdminAccess;

    return NextResponse.json({
      exists: true,
      email,
      firebaseAuth: {
        found: true,
        uid: user.uid,
        emailVerified: user.emailVerified,
        provider: user.providerData[0]?.providerId || 'N/A',
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime || 'Nunca',
      },
      customClaims: {
        ...claims,
        hasInternal,
        hasRole,
        isSuperAdmin: isSuperAdminUser,
        complete: hasInternal && hasRole,
      },
      firestore: firestoreData,
      summary: {
        hasAccess,
        canAccessAdmin: hasInternal && hasRole,
        canSeeButtonInAura: firestoreData?.hasPortalAdminAccess === true,
        missing,
        recommendations: hasAccess 
          ? ['Usuario completamente configurado. Si no ve el botón, debe cerrar sesión y volver a entrar en Aura.']
          : [
              ...(missing.length > 0 ? [`Configurar: ${missing.join(', ')}`] : []),
              'Usar Settings → Gestión de Usuarios → Agregar Usuario para configurar automáticamente'
            ],
      },
    });
  } catch (error: any) {
    console.error('[Revisar Usuario] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error revisando usuario' },
      { status: 500 }
    );
  }
}

