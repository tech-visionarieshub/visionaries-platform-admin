/**
 * Script para eliminar proyectos mock de Firestore
 * 
 * Uso:
 * npx tsx scripts/delete-mock-projects.ts [--dry-run]
 * 
 * Opciones:
 * --dry-run: Solo lista los proyectos que se eliminarían sin borrarlos
 */

import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Parsear argumentos
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Ruta a las credenciales de Firebase
const credentialsPath = '/Users/gabrielapino/Downloads/visionaries-platform-admin-firebase-adminsdk-fbsvc-eb269c3166.json';

// Inicializar Firebase Admin con las credenciales
if (!admin.apps.length) {
  try {
    if (fs.existsSync(credentialsPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'visionaries-platform-admin',
      });
      console.log('✅ Firebase Admin inicializado con credenciales del archivo\n');
    } else {
      console.error(`❌ No se encontró el archivo de credenciales en: ${credentialsPath}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// IDs de proyectos mock que se deben eliminar
const mockProjectIds = ['1', '2', '3', '4'];

// Nombres de proyectos mock que se deben eliminar
const mockProjectNames = [
  'Plataforma E-commerce',
  'App Móvil Delivery',
  'Sistema CRM Interno',
  'Portal de Clientes'
];

async function deleteMockProjects() {
  console.log('🗑️  Iniciando eliminación de proyectos mock...\n');

  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - No se eliminarán proyectos\n');
  }

  try {
    const projectsRef = db.collection('projects');

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
      console.log('✅ No se encontraron proyectos mock para eliminar');
      return;
    }

    console.log(`📋 Se encontraron ${foundProjects.length} proyectos mock:\n`);
    
    for (const doc of foundProjects) {
      const data = doc.data();
      console.log(`   - ${data.name} (ID: ${doc.id})`);
      console.log(`     Cliente: ${data.client}`);
      console.log(`     Estado: ${data.status}`);
    }

    if (!dryRun) {
      console.log('\n🗑️  Eliminando proyectos...\n');
      
      const batch = db.batch();
      for (const doc of foundProjects) {
        // Eliminar también las subcolecciones (features, documents, etc.)
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
      
      console.log(`✅ Se eliminaron ${foundProjects.length} proyectos mock y sus subcolecciones`);
    } else {
      console.log('\n⚠️  En modo dry-run, no se eliminaron proyectos');
      console.log('   Ejecuta sin --dry-run para eliminar realmente');
    }

  } catch (error: any) {
    console.error('❌ Error eliminando proyectos mock:', error.message);
    process.exit(1);
  }
}

deleteMockProjects()
  .then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

