/**
 * Script para cargar usuarios globales a Firestore
 * Ejecutar con: npx tsx scripts/upload-users.ts
 * 
 * Requiere: FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN en .env.local
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Cargar variables de entorno desde .env.local manualmente
try {
  const envPath = resolve(__dirname, '../.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        // Remover comillas si existen
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env[key.trim()] = cleanValue
      }
    }
  })
} catch (error) {
  console.warn('No se pudo cargar .env.local, usando variables de entorno del sistema')
}

import { getInternalFirestore } from '../lib/firebase/admin-platform'

interface User {
  email: string
  displayName: string
  photoURL?: string
  role: 'member' | 'admin'
  createdAt: Date
}

const users: Omit<User, 'createdAt'>[] = [
  { email: 'alecmuza@visionarieshub.com', displayName: 'Alec Muza', role: 'member' },
  { email: 'arelyibarra@visionarieshub.com', displayName: 'Arely Ibarra', role: 'member' },
  { email: 'gabypino@visionarieshub.com', displayName: 'Gabriela Pino', role: 'member' },
  { email: 'jc@visionarieshub.com', displayName: 'JC Garza', role: 'member' },
  { email: 'joseangel@visionarieshub.com', displayName: 'Jose Ángel Aleman', role: 'member' },
  { email: 'design@visionarieshub.com', displayName: 'Paulina Zentella', role: 'member' },
  { email: 'rodolfo@visionarieshub.com', displayName: 'Rodolfo Aguirre', role: 'member' },
  { email: 'mikevb3@gmail.com', displayName: 'Mike Villarreal', role: 'member' },
]

async function uploadUsers() {
  try {
    const db = getInternalFirestore()
    const usersRef = db.collection('users')
    const batch = db.batch()

    console.log('Iniciando carga de usuarios...')

    for (const user of users) {
      const userRef = usersRef.doc(user.email) // Usar email como ID
      const existingDoc = await userRef.get()

      if (existingDoc.exists) {
        console.log(`Usuario ${user.email} ya existe, actualizando...`)
        batch.update(userRef, {
          displayName: user.displayName,
          role: user.role,
          updatedAt: new Date(),
        })
      } else {
        console.log(`Creando usuario ${user.email}...`)
        batch.set(userRef, {
          ...user,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    await batch.commit()
    console.log(`✅ ${users.length} usuarios procesados exitosamente`)
  } catch (error: any) {
    console.error('❌ Error cargando usuarios:', error)
    process.exit(1)
  }
}

uploadUsers()

