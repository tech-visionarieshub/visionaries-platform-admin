import { NextRequest, NextResponse } from 'next/server';
import { getAuraAuth } from '@/lib/firebase/admin-tech';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import admin from 'firebase-admin';

/**
 * Busca un usuario y muestra todas las empresas/clientes asignados
 * GET /api/admin/buscar-usuario-empresas?email=usuario@example.com
 * Headers: Authorization: Bearer <idToken>
 * 
 * Solo usuarios superadmin pueden buscar usuarios
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
        { error: 'Solo superadmins pueden buscar usuarios' },
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
    const app = admin.app('aura');
    const db = app.firestore();
    
    // 1. Verificar en Firebase Auth
    let authUser;
    try {
      authUser = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({
          exists: false,
          email,
          message: 'Usuario no encontrado en Firebase Auth',
        });
      }
      throw error;
    }

    // 2. Buscar en todas las plataformas
    const platformsSnapshot = await db.collection('platforms').get();
    const userPlatforms: any[] = [];
    const companies: any[] = [];

    for (const platformDoc of platformsSnapshot.docs) {
      const platformData = platformDoc.data();
      const platformCode = platformData.code || platformDoc.id;
      const platformName = platformData.name || platformCode;
      
      const platformRef = platformDoc.ref;
      const usersCollection = platformRef.collection('users');
      const userSnapshot = await usersCollection.where('email', '==', email).limit(1).get();

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        
        const platformInfo = {
          platformId: platformDoc.id,
          platformCode,
          platformName,
          userId: userDoc.id,
          userData: {
            email: userData.email,
            name: userData.name,
            firstName: userData.firstName,
            lastName: userData.lastName,
            companyName: userData.companyName,
            isActive: userData.isActive,
            createdAt: userData.createdAt,
            hasPortalAdminAccess: userData.hasPortalAdminAccess,
            allowedAutomationsIds: userData.allowedAutomationsIds || [],
            allowedAutomationsFields: userData.allowedAutomationsFields || [],
          },
        };

        userPlatforms.push(platformInfo);

        // Si no es Aura, es una empresa/cliente
        if (platformCode !== 'visionaries-aura') {
          companies.push({
            companyId: platformDoc.id,
            companyCode: platformCode,
            companyName: platformName,
            userId: userDoc.id,
            hasAccess: true,
            automationsCount: userData.allowedAutomationsIds?.length || 0,
            automations: userData.allowedAutomationsIds || [],
            createdAt: userData.createdAt,
          });
        }
      }
    }

    // 3. Obtener información de Firebase Auth
    const customClaims = authUser.customClaims || {};

    return NextResponse.json({
      exists: true,
      email,
      firebaseAuth: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        createdAt: authUser.metadata.creationTime,
        lastSignIn: authUser.metadata.lastSignInTime || 'Nunca',
        customClaims,
      },
      platforms: userPlatforms,
      companies: companies,
      summary: {
        totalPlatforms: userPlatforms.length,
        totalCompanies: companies.length,
        hasAuraAccess: userPlatforms.some(p => p.platformCode === 'visionaries-aura'),
        companiesList: companies.map(c => c.companyName || c.companyCode),
      },
    });
  } catch (error: any) {
    console.error('[Buscar Usuario Empresas] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error buscando usuario' },
      { status: 500 }
    );
  }
}




