const admin = require('firebase-admin');
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
      // Remover comillas si existen
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// Cargar el Service Account JSON
const serviceAccountPath = path.join(__dirname, '..', 'visionaries-calendar-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: No se encontró el archivo visionaries-calendar-key.json');
  console.error(`   Buscado en: ${serviceAccountPath}`);
  process.exit(1);
}

// Leer el Service Account JSON
const serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Inicializar Firebase Admin con el Service Account de visionaries-platform-admin
// Necesitamos usar el Service Account de platform-admin para acceder a su Firestore
const platformAdminSA = process.env.FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN;

if (!platformAdminSA) {
  console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN no está configurado');
  console.error('   Asegúrate de tener esta variable de entorno configurada');
  process.exit(1);
}

let credential;
try {
  // Parsear el Service Account
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

// Inicializar Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential,
    projectId: 'visionaries-platform-admin',
  });
}

const db = admin.firestore();

async function saveGoogleCalendarConfig() {
  try {
    console.log('📝 Guardando configuración de Google Calendar en Firestore...');
    
    // Validar que el Service Account JSON tenga los campos requeridos
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
    const missingFields = requiredFields.filter(field => !serviceAccountJson[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Error: El Service Account JSON está incompleto. Faltan campos: ${missingFields.join(', ')}`);
      process.exit(1);
    }
    
    if (serviceAccountJson.type !== 'service_account') {
      console.error('❌ Error: El JSON proporcionado no es un Service Account válido (type debe ser "service_account")');
      process.exit(1);
    }
    
    // Guardar en Firestore
    await db.collection('config').doc('googleCalendar').set({
      serviceAccountJson: serviceAccountJson, // Guardar como objeto
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'script',
    }, { merge: true });
    
    console.log('✅ Configuración de Google Calendar guardada exitosamente en Firestore');
    console.log(`   Collection: config/googleCalendar`);
    console.log(`   Service Account: ${serviceAccountJson.client_email}`);
    console.log(`   Project ID: ${serviceAccountJson.project_id}`);
    
  } catch (error) {
    console.error('❌ Error guardando configuración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await admin.app().delete();
  }
}

saveGoogleCalendarConfig();

