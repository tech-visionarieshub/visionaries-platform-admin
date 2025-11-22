/**
 * Script para asignar acceso interno a usuarios
 * Ejecutar desde el backend de visionaries-tech o Cloud Functions
 * 
 * Uso:
 * ts-node scripts/assign-internal-access.ts <uid> <role>
 * 
 * Ejemplo:
 * ts-node scripts/assign-internal-access.ts abc123 admin
 */

import { setCustomUserClaims } from '../lib/firebase/admin-tech';

async function main() {
  const uid = process.argv[2];
  const role = process.argv[3] || 'admin';

  if (!uid) {
    console.error('❌ Error: UID es requerido');
    console.error('Uso: ts-node scripts/assign-internal-access.ts <uid> <role>');
    console.error('Ejemplo: ts-node scripts/assign-internal-access.ts abc123 admin');
    process.exit(1);
  }

  try {
    await setCustomUserClaims(uid, {
      internal: true,
      role: role,
    });
    
    console.log(`✅ Acceso interno asignado a ${uid} con rol ${role}`);
    console.log('⚠️  El usuario debe refrescar su token para que los cambios surtan efecto');
    console.log('   En el frontend, llama: await getIdToken(true)');
  } catch (error) {
    console.error('❌ Error asignando acceso:', error);
    process.exit(1);
  }
}

main();




