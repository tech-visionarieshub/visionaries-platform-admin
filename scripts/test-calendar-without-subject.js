const admin = require('firebase-admin');
const { google } = require('googleapis');
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

async function testWithoutSubject() {
  try {
    console.log('📋 Obteniendo Service Account de Google Calendar desde Firestore...');
    const configDoc = await db.collection('config').doc('googleCalendar').get();
    
    if (!configDoc.exists) {
      console.error('❌ Error: No se encontró la configuración');
      process.exit(1);
    }
    
    const data = configDoc.data();
    const serviceAccountJson = data?.serviceAccountJson;
    
    if (!serviceAccountJson) {
      console.error('❌ Error: Service Account JSON no está configurado');
      process.exit(1);
    }
    
    console.log('✅ Service Account encontrado:', serviceAccountJson.client_email);
    
    // Probar SIN subject primero (sin impersonar)
    console.log('\n🔍 Prueba 1: Sin impersonar (sin subject)...');
    const jwtClientNoSubject = new JWT({
      email: serviceAccountJson.client_email,
      key: serviceAccountJson.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    
    try {
      await jwtClientNoSubject.authorize();
      console.log('✅ Token obtenido sin subject');
      
      const calendarNoSubject = google.calendar({
        version: 'v3',
        auth: jwtClientNoSubject,
      });
      
      // Esto debería fallar porque no tiene acceso a calendarios de usuarios
      await calendarNoSubject.calendarList.list();
      console.log('⚠️  Inesperado: Funcionó sin subject');
    } catch (error) {
      console.log('✅ Esperado: Falló sin subject (normal)');
      console.log(`   Error: ${error.message}`);
    }
    
    // Probar CON subject
    console.log('\n🔍 Prueba 2: Con impersonación (con subject)...');
    const ADMIN_EMAIL = 'magic@visionarieshub.com';
    const jwtClientWithSubject = new JWT({
      email: serviceAccountJson.client_email,
      key: serviceAccountJson.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: ADMIN_EMAIL,
    });
    
    await jwtClientWithSubject.authorize();
    console.log('✅ Token obtenido con subject');
    console.log(`   Token expira en: ${new Date(jwtClientWithSubject.credentials.expiry_date || 0).toISOString()}`);
    
    const calendarWithSubject = google.calendar({
      version: 'v3',
      auth: jwtClientWithSubject,
    });
    
    console.log('📅 Intentando obtener calendarios...');
    const calendarList = await calendarWithSubject.calendarList.list();
    console.log('✅✅✅ ¡Funcionó!');
    console.log(`   Calendarios encontrados: ${calendarList.data.items?.length || 0}`);
    
    if (calendarList.data.items && calendarList.data.items.length > 0) {
      const primary = calendarList.data.items.find(cal => cal.primary) || calendarList.data.items[0];
      console.log(`   Calendario principal: ${primary.summary || 'Sin nombre'}`);
      console.log(`   ID: ${primary.id}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n📋 Detalles:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

testWithoutSubject();

