#!/usr/bin/env node

/**
 * Script para asignar acceso interno usando Firebase CLI credentials
 * Similar a create-visionaries-platform-admin-firebase.js
 * 
 * Uso:
 * node scripts/assign-access-direct.js adminplatform@visionarieshub.com admin
 */

const admin = require('firebase-admin');

const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('❌ Error: Email es requerido');
  console.error('Uso: node scripts/assign-access-direct.js <email> [role]');
  process.exit(1);
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  try {
    // Intentar usar Application Default Credentials (gcloud auth application-default login)
    admin.initializeApp({
      projectId: 'visionaries-tech'
    });
    console.log('✅ Firebase Admin inicializado con Application Default Credentials\n');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error.message);
    console.log('\n💡 Asegúrate de estar autenticado con:');
    console.log('   gcloud auth application-default login');
    console.log('   O configura FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH');
    process.exit(1);
  }
}

const auth = admin.auth();

async function main() {
  try {
    // Buscar usuario por email
    console.log(`🔍 Buscando usuario con email: ${email}`);
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.email} (UID: ${user.uid})\n`);

    // Verificar claims actuales
    if (user.customClaims) {
      console.log(`📋 Claims actuales:`, JSON.stringify(user.customClaims, null, 2));
    } else {
      console.log(`📋 No hay claims actuales\n`);
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
      console.error(`\n❌ Error: Usuario no encontrado: ${email}`);
      console.error('   Verifica que el email sea correcto en Firebase Console');
    } else {
      console.error('\n❌ Error asignando acceso:', error.message);
    }
    process.exit(1);
  }
}

main();

