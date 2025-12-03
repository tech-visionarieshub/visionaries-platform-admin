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

async function verifyUser() {
  try {
    console.log('📋 Verificando configuración...');
    const configDoc = await db.collection('config').doc('googleCalendar').get();
    const data = configDoc.data();
    const serviceAccountJson = data?.serviceAccountJson;
    
    const ADMIN_EMAIL = 'magic@visionarieshub.com';
    
    console.log('\n🔍 Información de configuración:');
    console.log(`   Service Account: ${serviceAccountJson.client_email}`);
    console.log(`   Client ID: ${serviceAccountJson.client_id}`);
    console.log(`   Usuario a impersonar: ${ADMIN_EMAIL}`);
    console.log(`   Scope: https://www.googleapis.com/auth/calendar`);
    
    console.log('\n📝 Verificando Domain-Wide Delegation:');
    console.log('   1. Ve a https://admin.google.com');
    console.log('   2. Seguridad > API Controls > Domain-wide Delegation');
    console.log(`   3. Verifica que el Client ID ${serviceAccountJson.client_id} esté listado`);
    console.log('   4. Verifica que el scope https://www.googleapis.com/auth/calendar esté autorizado');
    
    console.log('\n🔍 Probando autenticación...');
    const jwtClient = new JWT({
      email: serviceAccountJson.client_email,
      key: serviceAccountJson.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: ADMIN_EMAIL,
    });
    
    const tokenResponse = await jwtClient.authorize();
    console.log('✅ Token obtenido exitosamente');
    console.log(`   Token type: ${tokenResponse.token_type}`);
    console.log(`   Expira en: ${new Date(tokenResponse.expiry_date || 0).toISOString()}`);
    
    // Verificar que el token tiene el formato correcto
    if (!tokenResponse.access_token) {
      console.error('❌ Error: El token no tiene access_token');
      process.exit(1);
    }
    
    console.log(`   Token (primeros 20 chars): ${tokenResponse.access_token.substring(0, 20)}...`);
    
    // Intentar usar el token manualmente
    console.log('\n📅 Probando acceso a Calendar API...');
    const calendar = google.calendar({
      version: 'v3',
      auth: jwtClient,
    });
    
    // Verificar que el auth está configurado
    console.log('   Auth configurado:', !!calendar.context._options.auth);
    
    try {
      const calendarList = await calendar.calendarList.list();
      console.log('✅✅✅ ¡ÉXITO! Calendarios obtenidos');
      console.log(`   Total: ${calendarList.data.items?.length || 0} calendarios`);
    } catch (apiError) {
      console.error('❌ Error al acceder a Calendar API:');
      console.error(`   Status: ${apiError.response?.status}`);
      console.error(`   Message: ${apiError.message}`);
      if (apiError.response?.data) {
        console.error('   Detalles:', JSON.stringify(apiError.response.data, null, 2));
      }
      
      if (apiError.response?.status === 401) {
        console.error('\n💡 Posibles soluciones:');
        console.error('   1. Verifica que el usuario magic@visionarieshub.com existe en el dominio');
        console.error('   2. Espera 5-10 minutos después de configurar Domain-Wide Delegation');
        console.error('   3. Verifica que el scope esté exactamente: https://www.googleapis.com/auth/calendar');
        console.error('   4. Asegúrate de que el dominio visionarieshub.com esté correcto');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

verifyUser();












