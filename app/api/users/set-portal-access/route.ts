import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import { z } from 'zod';

/**
 * API para establecer hasPortalAdminAccess en Firestore
 * POST /api/users/set-portal-access
 * 
 * Body: { email: string, hasAccess: boolean }
 * 
 * Solo superadmin puede ejecutar esta acción
 * 
 * IMPORTANTE: hasPortalAdminAccess se lee desde Aura, no desde custom claims.
 * Este campo debe estar en la colección 'users' del proyecto visionaries-platform-admin.
 */

const setPortalAccessSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  hasAccess: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario que hace la petición sea superadmin
    const token = extractBearerToken(request);
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = await verifyIdToken(token);
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Solo superadmins pueden establecer acceso al portal' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, hasAccess } = setPortalAccessSchema.parse(body);

    try {
      const db = getInternalFirestore();
      const usersRef = db.collection('users');

      // Buscar usuario por email
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (snapshot.empty) {
        // Crear nuevo documento
        const newUserRef = usersRef.doc();
        await newUserRef.set({
          email,
          name: email.split('@')[0],
          isActive: true,
          hasPortalAdminAccess: hasAccess,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Usuario creado con hasPortalAdminAccess: ${hasAccess}`,
          documentId: newUserRef.id,
          note: 'El usuario debe cerrar sesión y volver a entrar en Aura para que los cambios surtan efecto.',
        });
      } else {
        // Actualizar documento existente
        const userDoc = snapshot.docs[0];
        await userDoc.ref.update({
          hasPortalAdminAccess: hasAccess,
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Usuario actualizado con hasPortalAdminAccess: ${hasAccess}`,
          documentId: userDoc.id,
          note: 'El usuario debe cerrar sesión y volver a entrar en Aura para que los cambios surtan efecto.',
        });
      }
    } catch (error: any) {
      console.error('[Set Portal Access] Error accediendo a Firestore:', error);
      
      if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN no está configurado. Necesitas el service account de visionaries-platform-admin.' 
          },
          { status: 500 }
        );
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('[API Set Portal Access] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido al establecer acceso' },
      { status: 500 }
    );
  }
}

