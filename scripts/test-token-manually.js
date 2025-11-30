const admin = require('firebase-admin');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const platformAdminSA = process.env.FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN;
if (!platformAdminSA) {
  console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN no está configurado');
  process.exit(1);
}

let credential;
try {
  let jsonString = platformAdminSA.trim();
  if ((jsonString.startsWith("'") && jsonString.endsWith("'")) || 
      (jsonString.startsWith('"') && jsonString.endsWith('"'))) {
    jsonString = jsonString.slice(1, -1);
  }
  const platformAdminJson = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  credential = admin.credential.cert(platformAdminJson);
} catch (error) {
  console.error('❌ Error parseando FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN:', error.message);
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential,
    projectId: 'visionaries-platform-admin',
  });
}

const db = admin.firestore();

async function testTokenManually() {
  try {
    console.log('📋 Obteniendo Service Account...');
    const configDoc = await db.collection('config').doc('googleCalendar').get();
    const data = configDoc.data();
    const serviceAccountJson = data?.serviceAccountJson;
    
    const ADMIN_EMAIL = 'magic@visionarieshub.com';
    
    console.log('🔐 Obteniendo token...');
    const jwtClient = new JWT({
      email: serviceAccountJson.client_email,
      key: serviceAccountJson.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: ADMIN_EMAIL,
    });
    
    const tokenResponse = await jwtClient.authorize();
    console.log('✅ Token obtenido');
    console.log(`   Access token (primeros 30 chars): ${tokenResponse.access_token.substring(0, 30)}...`);
    
    // Probar usando el token manualmente con fetch
    console.log('\n📅 Probando Calendar API con token manual...');
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅✅✅ ¡ÉXITO con fetch manual!');
      console.log(`   Calendarios encontrados: ${data.items?.length || 0}`);
      if (data.items && data.items.length > 0) {
        const primary = data.items.find(cal => cal.primary) || data.items[0];
        console.log(`   Calendario principal: ${primary.summary || 'Sin nombre'}`);
        console.log(`   ID: ${primary.id}`);
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Error con fetch manual:');
      console.error(JSON.stringify(errorData, null, 2));
      
      if (response.status === 401) {
        console.error('\n💡 El token se obtiene pero Google lo rechaza.');
        console.error('   Esto podría significar:');
        console.error('   1. El scope no está correctamente autorizado en Domain-Wide Delegation');
        console.error('   2. El usuario magic@visionarieshub.com no tiene permisos');
        console.error('   3. Necesitas esperar más tiempo para que se propague la configuración');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

testTokenManually();






