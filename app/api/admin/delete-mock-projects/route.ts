import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import admin from 'firebase-admin';

/**
 * DELETE - Eliminar proyectos mock de Firestore
 * Solo superadmins pueden ejecutar esta acción
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const isSuperAdmin = user.superadmin === true || user.email === 'adminplatform@visionarieshub.com';
      
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Solo superadmins pueden eliminar proyectos mock' },
          { status: 403 }
        );
      }

      const db = getInternalFirestore();
      const projectsRef = db.collection('projects');

      // IDs de proyectos mock que se deben eliminar
      const mockProjectIds = ['1', '2', '3', '4'];

      // Nombres de proyectos mock que se deben eliminar
      const mockProjectNames = [
        'Plataforma E-commerce',
        'App Móvil Delivery',
        'Sistema CRM Interno',
        'Portal de Clientes'
      ];

      // Buscar proyectos por ID
      let foundProjects: admin.firestore.DocumentSnapshot[] = [];
      
      for (const id of mockProjectIds) {
        const doc = await projectsRef.doc(id).get();
        if (doc.exists) {
          foundProjects.push(doc);
        }
      }

      // Si no se encontraron por ID, buscar por nombre
      if (foundProjects.length === 0) {
        const allProjects = await projectsRef.get();
        foundProjects = allProjects.docs.filter(doc => {
          const data = doc.data();
          return mockProjectNames.includes(data.name);
        });
      }

      if (foundProjects.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No se encontraron proyectos mock para eliminar',
          deleted: 0,
        });
      }

      // Eliminar proyectos y sus subcolecciones
      const batch = db.batch();
      const deletedProjects: string[] = [];

      for (const doc of foundProjects) {
        const data = doc.data();
        deletedProjects.push(`${data.name} (ID: ${doc.id})`);

        // Eliminar subcolecciones
        const subcollections = ['features', 'documents', 'status-reports', 'qa-tasks'];
        
        for (const subcollection of subcollections) {
          const subcollectionRef = doc.ref.collection(subcollection);
          const subcollectionDocs = await subcollectionRef.get();
          
          subcollectionDocs.docs.forEach(subDoc => {
            batch.delete(subDoc.ref);
          });
        }
        
        // Eliminar el proyecto
        batch.delete(doc.ref);
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: `Se eliminaron ${foundProjects.length} proyectos mock`,
        deleted: foundProjects.length,
        projects: deletedProjects,
      });
    } catch (error: any) {
      console.error('[Delete Mock Projects] Error:', error);
      return NextResponse.json(
        { error: 'Error eliminando proyectos mock', message: error.message },
        { status: 500 }
      );
    }
  });
}

