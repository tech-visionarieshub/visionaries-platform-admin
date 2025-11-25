const admin = require('firebase-admin');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
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

// Inicializar Firebase Admin
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

async function testConnection() {
  try {
    console.log('📋 Obteniendo Service Account de Google Calendar desde Firestore...');
    
    // Obtener Service Account de Firestore
    const configDoc = await db.collection('config').doc('googleCalendar').get();
    
    if (!configDoc.exists) {
      console.error('❌ Error: No se encontró la configuración de Google Calendar en Firestore');
      console.error('   Ejecuta: node scripts/save-google-calendar-config.js');
      process.exit(1);
    }
    
    const data = configDoc.data();
    const serviceAccountJson = data?.serviceAccountJson;
    
    if (!serviceAccountJson) {
      console.error('❌ Error: Service Account JSON no está configurado en Firestore');
      process.exit(1);
    }
    
    console.log('✅ Service Account encontrado:', serviceAccountJson.client_email);
    console.log('📝 Probando conexión con Google Calendar...');
    
    // Crear JWT client con domain-wide delegation
    const ADMIN_EMAIL = 'magic@visionarieshub.com';
    const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];
    
    const jwtClient = new JWT({
      email: serviceAccountJson.client_email,
      key: serviceAccountJson.private_key,
      scopes: CALENDAR_SCOPES,
      subject: ADMIN_EMAIL, // Impersonar al usuario admin
    });
    
    console.log('🔐 Autenticando con Google Calendar API...');
    console.log(`   Service Account: ${serviceAccountJson.client_email}`);
    console.log(`   Impersonando: ${ADMIN_EMAIL}`);
    
    // Obtener token explícitamente antes de usar el cliente
    console.log('🔑 Obteniendo token de acceso...');
    await jwtClient.authorize();
    console.log('✅ Token obtenido exitosamente');
    
    const calendar = google.calendar({
      version: 'v3',
      auth: jwtClient,
    });
    
    // Probar obtener lista de calendarios usando el email directamente
    console.log('📅 Obteniendo lista de calendarios...');
    console.log(`   Intentando con email: ${ADMIN_EMAIL}`);
    
    // Intentar con el email del usuario directamente
    const calendarList = await calendar.calendarList.list({
      // No usar 'me', usar el email directamente si es necesario
    });
    
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary) || calendarList.data.items?.[0];
    
    if (!primaryCalendar?.id) {
      console.error('❌ Error: No se encontró calendario principal');
      process.exit(1);
    }
    
    console.log('✅ Conexión exitosa!');
    console.log(`   Calendario principal: ${primaryCalendar.summary || 'Sin nombre'}`);
    console.log(`   ID: ${primaryCalendar.id}`);
    console.log(`   Timezone: ${primaryCalendar.timeZone || 'N/A'}`);
    
    // Probar crear un evento de prueba
    console.log('\n📝 Probando crear un evento de prueba...');
    const testEvent = {
      summary: 'Test Event - Visionaries Calendar Sync',
      description: 'Este es un evento de prueba para verificar la integración',
      start: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora desde ahora
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas desde ahora
        timeZone: 'America/Mexico_City',
      },
      attendees: [{ email: ADMIN_EMAIL }],
    };
    
    const createdEvent = await calendar.events.insert({
      calendarId: primaryCalendar.id,
      requestBody: testEvent,
      sendUpdates: 'none', // No enviar invitaciones en la prueba
    });
    
    console.log('✅ Evento de prueba creado exitosamente!');
    console.log(`   ID: ${createdEvent.data.id}`);
    console.log(`   Título: ${createdEvent.data.summary}`);
    console.log(`   Link: ${createdEvent.data.htmlLink}`);
    
    // Eliminar el evento de prueba
    console.log('\n🗑️  Eliminando evento de prueba...');
    await calendar.events.delete({
      calendarId: primaryCalendar.id,
      eventId: createdEvent.data.id,
    });
    console.log('✅ Evento de prueba eliminado');
    
    console.log('\n✅✅✅ Todas las pruebas pasaron exitosamente!');
    console.log('   La integración con Google Calendar está funcionando correctamente.');
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    
    if (error.code === 403) {
      console.error('\n💡 Posibles causas:');
      console.error('   1. Domain-wide delegation no está configurado correctamente');
      console.error('   2. El Client ID no está autorizado en Google Workspace Admin');
      console.error('   3. El scope no está autorizado');
      console.error('\n   Verifica en Google Workspace Admin Console:');
      console.error('   - Seguridad > API Controls > Domain-wide Delegation');
      console.error('   - Client ID: 110617753637691984482');
      console.error('   - Scope: https://www.googleapis.com/auth/calendar');
    } else if (error.code === 401) {
      console.error('\n💡 Posibles causas:');
      console.error('   1. El Service Account JSON es inválido');
      console.error('   2. Las credenciales han expirado');
    }
    
    console.error('\n📋 Detalles del error:');
    console.error(error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

testConnection();

