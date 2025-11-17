/**
 * Script para verificar la conexión a Firestore de visionaries-platform-admin
 * Usa Application Default Credentials del CLI
 * 
 * Uso:
 * firebase use visionaries-platform-admin
 * npx tsx scripts/verify-firestore-connection.ts
 */

import admin from 'firebase-admin';

async function main() {
  try {
    console.log('🔍 Verificando conexión a Firestore...\n');

    // Inicializar Firebase Admin con Application Default Credentials
    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          projectId: 'visionaries-platform-admin',
          // Usar Application Default Credentials (del CLI)
        });
        console.log('✅ Firebase Admin inicializado con Application Default Credentials');
      } catch (error: any) {
        console.error('❌ Error inicializando Firebase Admin:', error.message);
        console.error('\n💡 Asegúrate de estar autenticado con Firebase CLI:');
        console.error('   firebase login');
        console.error('   firebase use visionaries-platform-admin');
        console.error('   O configura GOOGLE_APPLICATION_CREDENTIALS');
        process.exit(1);
      }
    }

    const db = admin.firestore();

    // Probar lectura de una colección
    console.log('\n📖 Probando lectura de Firestore...');
    const testCollection = db.collection('_test');
    
    // Intentar leer (puede estar vacía, eso está bien)
    const snapshot = await testCollection.limit(1).get();
    console.log('✅ Lectura exitosa');

    // Probar escritura temporal
    console.log('\n✍️  Probando escritura en Firestore...');
    const testDoc = testCollection.doc('connection-test');
    await testDoc.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: true,
      message: 'Conexión verificada exitosamente'
    });
    console.log('✅ Escritura exitosa');

    // Limpiar documento de prueba
    console.log('\n🧹 Limpiando documento de prueba...');
    await testDoc.delete();
    console.log('✅ Limpieza exitosa');

    // Listar colecciones existentes
    console.log('\n📚 Verificando colecciones existentes...');
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    if (collectionNames.length === 0) {
      console.log('⚠️  No hay colecciones en Firestore (esto es normal si es la primera vez)');
    } else {
      console.log(`✅ Encontradas ${collectionNames.length} colecciones:`);
      collectionNames.forEach(name => {
        console.log(`   - ${name}`);
      });
    }

    console.log('\n✅✅✅ Conexión a Firestore verificada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   - Lectura: ✅');
    console.log('   - Escritura: ✅');
    console.log('   - Eliminación: ✅');
    console.log('   - Listado de colecciones: ✅');
    
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Crear repositorios para cada entidad');
    console.log('   2. Crear API routes para CRUD');
    console.log('   3. Ejecutar script de migración de datos mock');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error verificando conexión:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n💡 Error de permisos. Verifica:');
      console.error('   1. Que el proyecto sea correcto: visionaries-platform-admin');
      console.error('   2. Que tengas permisos de lectura/escritura en Firestore');
      console.error('   3. Que las reglas de seguridad permitan acceso');
    } else if (error.code === 'unauthenticated') {
      console.error('\n💡 Error de autenticación. Ejecuta:');
      console.error('   firebase login');
      console.error('   firebase use visionaries-platform-admin');
    } else {
      console.error('\n💡 Detalles del error:');
      if (error.stack) {
        console.error(error.stack);
      }
    }
    
    process.exit(1);
  }
}

main();

