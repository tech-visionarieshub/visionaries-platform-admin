/**
 * Script para buscar a Arely y ver qué empresas tiene asignadas
 * 
 * Uso:
 *   npx tsx scripts/buscar-arely-empresas.ts
 */

import { getAuraAuth } from '../lib/firebase/admin-tech';
import admin from 'firebase-admin';

async function buscarArely() {
  try {
    const email = 'arelyibarra@visionarieshub.com';
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     BUSCANDO A ARELY Y SUS EMPRESAS ASIGNADAS                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`📧 Email: ${email}\n`);
    console.log('─'.repeat(60));
    
    const auth = getAuraAuth();
    const app = admin.app('aura');
    const db = app.firestore();
    
    // 1. Verificar en Firebase Auth
    console.log('\n🔍 1. VERIFICANDO EN FIREBASE AUTH...\n');
    
    let authUser;
    try {
      authUser = await auth.getUserByEmail(email);
      console.log('✅ Usuario encontrado en Firebase Auth');
      console.log(`   UID: ${authUser.uid}`);
      console.log(`   Email: ${authUser.email}`);
      console.log(`   Nombre: ${authUser.displayName || 'N/A'}`);
      console.log(`   Email verificado: ${authUser.emailVerified ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${authUser.metadata.creationTime}`);
      console.log(`   Último acceso: ${authUser.metadata.lastSignInTime || 'Nunca'}`);
      
      if (authUser.customClaims) {
        console.log(`   Custom Claims:`, JSON.stringify(authUser.customClaims, null, 2));
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ Usuario NO encontrado en Firebase Auth');
        process.exit(1);
      }
      throw error;
    }
    
    // 2. Buscar en todas las plataformas
    console.log('\n🔍 2. BUSCANDO EN PLATAFORMAS...\n');
    
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
          userData,
        };

        userPlatforms.push(platformInfo);

        // Si no es Aura, es una empresa/cliente
        if (platformCode !== 'visionaries-aura') {
          companies.push({
            companyId: platformDoc.id,
            companyCode: platformCode,
            companyName: platformName,
            userId: userDoc.id,
            automationsCount: userData.allowedAutomationsIds?.length || 0,
            automations: userData.allowedAutomationsIds || [],
            createdAt: userData.createdAt,
          });
        }
      }
    }
    
    // 3. Mostrar resultados
    console.log(`✅ Encontrado en ${userPlatforms.length} plataforma(s):\n`);
    
    for (const platform of userPlatforms) {
      console.log(`📦 ${platform.platformName} (${platform.platformCode})`);
      console.log(`   User ID: ${platform.userId}`);
      console.log(`   Nombre: ${platform.userData.name || 'N/A'}`);
      console.log(`   Activo: ${platform.userData.isActive !== false ? 'Sí' : 'No'}`);
      if (platform.userData.allowedAutomationsIds?.length > 0) {
        console.log(`   Automatizaciones: ${platform.userData.allowedAutomationsIds.length}`);
      }
      if (platform.userData.hasPortalAdminAccess) {
        console.log(`   ✅ Tiene acceso al Portal Admin`);
      }
      console.log('');
    }
    
    // 4. Mostrar empresas asignadas
    console.log('─'.repeat(60));
    console.log('\n🏢 EMPRESAS/CLIENTES ASIGNADAS:\n');
    
    if (companies.length === 0) {
      console.log('❌ No tiene empresas asignadas');
      console.log('   (Solo está en Aura, no tiene acceso a clientes)');
    } else {
      console.log(`✅ Tiene ${companies.length} empresa(s) asignada(s):\n`);
      
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.companyName} (${company.companyCode})`);
        console.log(`   ID: ${company.companyId}`);
        console.log(`   Automatizaciones: ${company.automationsCount}`);
        if (company.automations.length > 0) {
          console.log(`   IDs: ${company.automations.slice(0, 5).join(', ')}${company.automations.length > 5 ? '...' : ''}`);
        }
        console.log('');
      });
    }
    
    // 5. Resumen
    console.log('─'.repeat(60));
    console.log('\n📋 RESUMEN:\n');
    console.log(`✅ Firebase Auth: Usuario existe`);
    console.log(`✅ Plataformas: ${userPlatforms.length} (${userPlatforms.some(p => p.platformCode === 'visionaries-aura') ? 'Incluye Aura' : 'Sin Aura'})`);
    console.log(`✅ Empresas: ${companies.length}`);
    if (companies.length > 0) {
      console.log(`   → ${companies.map(c => c.companyName).join(', ')}`);
    }
    console.log('\n' + '═'.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error buscando usuario:', error.message);
    if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT')) {
      console.error('\n💡 Asegúrate de tener configuradas las variables de entorno:');
      console.error('   - FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH');
    }
    process.exit(1);
  }
}

buscarArely();







