/**
 * Script para asignar acceso interno usando Firebase CLI credentials
 * Usa Application Default Credentials del CLI
 * 
 * Uso:
 * firebase use visionaries-tech
 * node scripts/assign-access-firebase-cli.js adminplatform@visionarieshub.com admin
 */

const admin = require('firebase-admin');

const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('❌ Error: Email es requerido');
  console.error('Uso: node scripts/assign-access-firebase-cli.js <email> [role]');
  console.error('Ejemplo: node scripts/assign-access-firebase-cli.js adminplatform@visionarieshub.com admin');
  process.exit(1);
}

async function main() {
  try {
    // Inicializar Firebase Admin con Application Default Credentials
    // Esto usa las credenciales del CLI si están configuradas
    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          projectId: 'visionaries-tech',
          // Usar Application Default Credentials (del CLI)
        });
        console.log('✅ Firebase Admin inicializado con Application Default Credentials');
      } catch (error) {
        console.error('❌ Error inicializando Firebase Admin:', error.message);
        console.error('\n💡 Asegúrate de estar autenticado con Firebase CLI:');
        console.error('   firebase login');
        console.error('   firebase use visionaries-tech');
        console.error('   O configura GOOGLE_APPLICATION_CREDENTIALS');
        process.exit(1);
      }
    }

    const auth = admin.auth();

    // Buscar usuario por email
    console.log(`🔍 Buscando usuario con email: ${email}`);
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.email} (UID: ${user.uid})`);

    // Verificar claims actuales
    if (user.customClaims) {
      console.log(`📋 Claims actuales:`, user.customClaims);
    }

    // Asignar custom claims
    console.log(`🔧 Asignando custom claims: { internal: true, role: '${role}' }`);
    await auth.setCustomUserClaims(user.uid, {
      internal: true,
      role: role,
    });

    console.log(`\n✅ Acceso interno asignado exitosamente!`);
    console.log(`   Usuario: ${user.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Rol: ${role}`);
    console.log(`\n⚠️  IMPORTANTE: El usuario debe refrescar su token para que los cambios surtan efecto:`);
    console.log(`   1. Cerrar sesión en Aura`);
    console.log(`   2. Volver a iniciar sesión`);
    console.log(`   3. El botón "Portal Admin" debería aparecer en el sidebar`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: Usuario no encontrado: ${email}`);
      console.error('   Verifica que el email sea correcto en Firebase Console');
    } else if (error.code === 'auth/invalid-credential') {
      console.error('❌ Error: Credenciales inválidas');
      console.error('   Ejecuta: firebase login');
    } else {
      console.error('❌ Error asignando acceso:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();

