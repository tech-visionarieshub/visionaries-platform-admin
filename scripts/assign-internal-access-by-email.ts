/**
 * Script para asignar acceso interno a usuarios por email o UID
 * Ejecutar desde el backend de visionaries-tech
 * 
 * Uso:
 * ts-node scripts/assign-internal-access-by-email.ts <email|uid> <role>
 * 
 * Ejemplo:
 * ts-node scripts/assign-internal-access-by-email.ts adminplatform@visionarieshub.com admin
 * ts-node scripts/assign-internal-access-by-email.ts abc123 admin
 */

import { getAuraAuth, setCustomUserClaims } from '../lib/firebase/admin-tech';

async function main() {
  const identifier = process.argv[2];
  const role = process.argv[3] || 'admin';

  if (!identifier) {
    console.error('❌ Error: Email o UID es requerido');
    console.error('Uso: ts-node scripts/assign-internal-access-by-email.ts <email|uid> <role>');
    console.error('Ejemplo: ts-node scripts/assign-internal-access-by-email.ts adminplatform@visionarieshub.com admin');
    process.exit(1);
  }

  try {
    const auth = getAuraAuth();
    let uid: string;

    // Verificar si es email o UID
    if (identifier.includes('@')) {
      // Es un email, buscar el usuario
      console.log(`🔍 Buscando usuario con email: ${identifier}`);
      const user = await auth.getUserByEmail(identifier);
      uid = user.uid;
      console.log(`✅ Usuario encontrado: ${user.email} (UID: ${uid})`);
    } else {
      // Es un UID
      uid = identifier;
      const user = await auth.getUser(uid);
      console.log(`✅ Usuario encontrado: ${user.email} (UID: ${uid})`);
    }

    // Asignar custom claims
    await setCustomUserClaims(uid, {
      internal: true,
      role: role,
    });
    
    console.log(`✅ Acceso interno asignado a ${uid} con rol ${role}`);
    console.log('⚠️  El usuario debe refrescar su token para que los cambios surtan efecto');
    console.log('   - Cerrar sesión y volver a iniciar sesión');
    console.log('   - O en el frontend, llamar: await getIdToken(true)');
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: Usuario no encontrado: ${identifier}`);
    } else {
      console.error('❌ Error asignando acceso:', error);
    }
    process.exit(1);
  }
}

main();




