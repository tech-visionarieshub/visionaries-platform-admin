/**
 * Script simple para asignar acceso interno por email
 * Requiere: FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH como variable de entorno
 * 
 * Uso:
 * FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH='{...}' node scripts/assign-access-simple.js adminplatform@visionarieshub.com
 */

const admin = require('firebase-admin');

const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('❌ Error: Email es requerido');
  console.error('Uso: FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH=\'{...}\' node scripts/assign-access-simple.js <email> [role]');
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH;

if (!serviceAccountJson) {
  console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no está configurado');
  console.error('Ejemplo: FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH=\'{"type":"service_account",...}\' node scripts/assign-access-simple.js adminplatform@visionarieshub.com');
  process.exit(1);
}

async function main() {
  try {
    // Parsear service account
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH no es un JSON válido');
      process.exit(1);
    }

    // Inicializar Firebase Admin
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'visionaries-tech',
      });
    }

    const auth = admin.auth();

    // Buscar usuario por email
    console.log(`🔍 Buscando usuario con email: ${email}`);
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.email} (UID: ${user.uid})`);

    // Asignar custom claims
    await auth.setCustomUserClaims(user.uid, {
      internal: true,
      role: role,
    });

    console.log(`✅ Acceso interno asignado a ${email} con rol ${role}`);
    console.log('⚠️  El usuario debe refrescar su token para que los cambios surtan efecto:');
    console.log('   - Cerrar sesión y volver a iniciar sesión en Aura');
    console.log('   - O esperar a que el token expire (normalmente 1 hora)');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: Usuario no encontrado: ${email}`);
    } else {
      console.error('❌ Error asignando acceso:', error.message);
    }
    process.exit(1);
  }
}

main();

