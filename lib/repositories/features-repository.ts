/**
 * Repositorio para gestionar Features (Funcionalidades) en Firestore
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import admin from 'firebase-admin'
import type { Feature } from '@/types/feature'
import { Timestamp } from 'firebase-admin/firestore'

export class FeaturesRepository {
  private db = getInternalFirestore()

  /**
   * Obtiene la colección de features para un proyecto
   */
  private getFeaturesCollection(projectId: string) {
    return this.db.collection('projects').doc(projectId).collection('features')
  }

  /**
   * Genera un ID con formato: SIGLAS-P{NUM_PROYECTO}-{NUM_FUNCIONALIDAD}
   * Ejemplo: SGAC-P1-1, SGAC-P1-2, etc.
   */
  private async generateFeatureId(projectId: string, projectName?: string): Promise<string> {
    try {
      // Obtener información del proyecto
      const projectDoc = await this.db.collection('projects').doc(projectId).get()
      const projectData = projectDoc.data()
      const name = projectName || projectData?.name || 'PROJ'

      // Extraer siglas del nombre del proyecto (primeras letras mayúsculas de cada palabra)
      // Ejemplo: "Sistema de Gestión de Acciones Comerciales" -> "SGAC"
      const siglas = name
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase())
        .filter(char => /[A-Z]/.test(char))
        .join('')
        .substring(0, 4) || 'PROJ' // Máximo 4 caracteres, default 'PROJ'

      // Obtener número de proyecto (usar los últimos caracteres del ID o un hash)
      // Si el ID es alfanumérico, intentar extraer números, sino usar hash simple
      const projectNumMatch = projectId.match(/\d+/)
      const projectNum = projectNumMatch 
        ? projectNumMatch[0].substring(0, 3) // Máximo 3 dígitos
        : String(Math.abs(projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 999 + 1)

      // Contar funcionalidades existentes para obtener el siguiente número
      const existingFeatures = await this.getFeaturesCollection(projectId).get()
      const nextFeatureNum = existingFeatures.size + 1

      // Formato: SIGLAS-P{NUM}-{NUM_FUNCIONALIDAD}
      return `${siglas}-P${projectNum}-${nextFeatureNum}`
    } catch (error: any) {
      console.error('[Features Repository] Error generating ID:', error)
      // Fallback: usar timestamp si falla
      return `FEAT-${projectId.substring(0, 8)}-${Date.now()}`
    }
  }

  /**
   * Convierte un documento de Firestore a Feature
   */
  private fromFirestore(doc: admin.firestore.DocumentSnapshot): Feature {
    const data = doc.data()
    if (!data) {
      throw new Error(`Feature ${doc.id} does not exist`)
    }

    return {
      id: doc.id,
      projectId: data.projectId,
      epicTitle: data.epicTitle,
      title: data.title,
      description: data.description || '',
      criteriosAceptacion: data.criteriosAceptacion,
      comentarios: data.comentarios,
      tipo: data.tipo,
      categoria: data.categoria,
      status: data.status,
      priority: data.priority,
      assignee: data.assignee,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      startedAt: data.startedAt?.toDate?.() || (data.startedAt as Date | undefined),
      accumulatedTime: data.accumulatedTime || 0,
      githubBranch: data.githubBranch,
      commits: data.commits,
      storyPoints: data.storyPoints,
      sprint: data.sprint,
      createdBy: data.createdBy,
      qaTaskId: data.qaTaskId,
      createdAt: data.createdAt?.toDate?.() || (data.createdAt as Date),
      updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt as Date),
    }
  }

  /**
   * Convierte Feature a formato Firestore
   */
  private toFirestore(feature: Partial<Feature>): any {
    const { id, ...data } = feature as any
    const firestoreData: any = { ...data }

    // Convertir fechas a Timestamp si son Date
    if (firestoreData.createdAt instanceof Date) {
      firestoreData.createdAt = Timestamp.fromDate(firestoreData.createdAt)
    } else if (!firestoreData.createdAt) {
      firestoreData.createdAt = Timestamp.now()
    }

    if (firestoreData.updatedAt instanceof Date) {
      firestoreData.updatedAt = Timestamp.fromDate(firestoreData.updatedAt)
    } else {
      firestoreData.updatedAt = Timestamp.now()
    }

    // Convertir startedAt a Timestamp si es Date
    if (firestoreData.startedAt instanceof Date) {
      firestoreData.startedAt = Timestamp.fromDate(firestoreData.startedAt)
    } else if (firestoreData.startedAt === null || firestoreData.startedAt === undefined) {
      // No hacer nada, dejar que Firestore maneje null/undefined
      if (firestoreData.startedAt === null) {
        firestoreData.startedAt = null
      }
    }

    return firestoreData
  }

  /**
   * Extrae el número consecutivo del ID de una funcionalidad
   * Formato esperado: SIGLAS-P{NUM}-{NUM_FUNCIONALIDAD}
   * Ejemplo: SGAC-P1-5 -> retorna 5, SP-P7-97 -> retorna 97
   */
  private extractFeatureNumber(featureId: string): number {
    // Buscar el último número después del último guión
    const match = featureId.match(/-(\d+)$/)
    if (match && match[1]) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num)) {
        return num
      }
    }
    // Si no coincide el formato, retornar un número alto para que aparezcan al final
    return 999999
  }

  /**
   * Obtiene todas las funcionalidades de un proyecto, ordenadas por número consecutivo
   */
  async getAll(projectId: string): Promise<Feature[]> {
    try {
      const snapshot = await this.getFeaturesCollection(projectId).get()
      const features = snapshot.docs.map(doc => this.fromFirestore(doc))
      
      // Ordenar por número consecutivo del ID
      return features.sort((a, b) => {
        const numA = this.extractFeatureNumber(a.id)
        const numB = this.extractFeatureNumber(b.id)
        return numA - numB
      })
    } catch (error: any) {
      console.error('[Features Repository] Error getting all features:', error)
      throw new Error(`Error obteniendo funcionalidades: ${error.message}`)
    }
  }

  /**
   * Obtiene una funcionalidad por ID
   */
  async getById(projectId: string, featureId: string): Promise<Feature | null> {
    try {
      const doc = await this.getFeaturesCollection(projectId).doc(featureId).get()
      if (!doc.exists) {
        return null
      }
      return this.fromFirestore(doc)
    } catch (error: any) {
      console.error('[Features Repository] Error getting feature by ID:', error)
      throw new Error(`Error obteniendo funcionalidad: ${error.message}`)
    }
  }

  /**
   * Crea una nueva funcionalidad
   */
  async create(projectId: string, feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>, projectName?: string): Promise<Feature> {
    try {
      const featuresRef = this.getFeaturesCollection(projectId)
      
      // Generar ID con formato personalizado
      const featureId = await this.generateFeatureId(projectId, projectName)
      const docRef = featuresRef.doc(featureId)
      
      const now = Timestamp.now()
      const newFeature: Omit<Feature, 'id'> & { createdAt: Timestamp; updatedAt: Timestamp } = {
        ...feature,
        projectId, // Asegurar que projectId esté presente
        createdAt: now,
        updatedAt: now,
      }

      await docRef.set(this.toFirestore(newFeature))

      return {
        ...newFeature,
        id: featureId,
        createdAt: newFeature.createdAt.toDate(),
        updatedAt: newFeature.updatedAt.toDate(),
      }
    } catch (error: any) {
      console.error('[Features Repository] Error creating feature:', error)
      throw new Error(`Error creando funcionalidad: ${error.message}`)
    }
  }

  /**
   * Actualiza una funcionalidad
   */
  async update(projectId: string, featureId: string, updates: Partial<Feature>): Promise<Feature> {
    try {
      const docRef = this.getFeaturesCollection(projectId).doc(featureId)
      
      // No permitir actualizar id, projectId, createdAt
      const { id, projectId: _, createdAt, ...updateData } = updates as any
      
      // Asegurar que updatedAt siempre se actualice
      updateData.updatedAt = new Date()
      
      const firestoreData = this.toFirestore(updateData)
      // No actualizar createdAt, solo updatedAt
      delete firestoreData.createdAt
      
      console.log(`[Features Repository] Actualizando feature ${featureId} en proyecto ${projectId}:`, {
        camposActualizados: Object.keys(firestoreData),
        status: firestoreData.status,
        assignee: firestoreData.assignee,
      })
      
      await docRef.update(firestoreData)

      const updatedDoc = await docRef.get()
      if (!updatedDoc.exists) {
        throw new Error(`Feature ${featureId} does not exist`)
      }

      const updatedFeature = this.fromFirestore(updatedDoc)
      console.log(`[Features Repository] Feature ${featureId} actualizada exitosamente. Status actual:`, updatedFeature.status)
      
      return updatedFeature
    } catch (error: any) {
      console.error('[Features Repository] Error updating feature:', error)
      throw new Error(`Error actualizando funcionalidad: ${error.message}`)
    }
  }

  /**
   * Elimina una funcionalidad
   */
  async delete(projectId: string, featureId: string): Promise<void> {
    try {
      await this.getFeaturesCollection(projectId).doc(featureId).delete()
    } catch (error: any) {
      console.error('[Features Repository] Error deleting feature:', error)
      throw new Error(`Error eliminando funcionalidad: ${error.message}`)
    }
  }

  /**
   * Obtiene funcionalidades por Epic
   */
  async getByEpic(projectId: string, epicTitle: string): Promise<Feature[]> {
    try {
      const snapshot = await this.getFeaturesCollection(projectId)
        .where('epicTitle', '==', epicTitle)
        .get()
      return snapshot.docs.map(doc => this.fromFirestore(doc))
    } catch (error: any) {
      console.error('[Features Repository] Error getting features by epic:', error)
      throw new Error(`Error obteniendo funcionalidades por epic: ${error.message}`)
    }
  }

  /**
   * Crea múltiples funcionalidades en batch
   */
  async createBatch(projectId: string, features: Array<Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>>, projectName?: string): Promise<Feature[]> {
    try {
      const featuresRef = this.getFeaturesCollection(projectId)
      const batch = this.db.batch()
      const now = Timestamp.now()
      const createdFeatures: Feature[] = []

      // Obtener el número base de funcionalidades existentes
      const existingFeatures = await this.getFeaturesCollection(projectId).get()
      let featureCounter = existingFeatures.size

      // Obtener siglas y número de proyecto una sola vez
      const projectDoc = await this.db.collection('projects').doc(projectId).get()
      const projectData = projectDoc.data()
      const name = projectName || projectData?.name || 'PROJ'
      const siglas = name
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase())
        .filter(char => /[A-Z]/.test(char))
        .join('')
        .substring(0, 4) || 'PROJ'
      const projectNumMatch = projectId.match(/\d+/)
      const projectNum = projectNumMatch 
        ? projectNumMatch[0].substring(0, 3)
        : String(Math.abs(projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 999 + 1)

      for (const feature of features) {
        featureCounter++
        const featureId = `${siglas}-P${projectNum}-${featureCounter}`
        const docRef = featuresRef.doc(featureId)
        const newFeature = {
          ...feature,
          projectId,
          createdAt: now,
          updatedAt: now,
        }
        batch.set(docRef, this.toFirestore(newFeature))
        createdFeatures.push({
          ...newFeature,
          id: featureId,
          createdAt: now.toDate(),
          updatedAt: now.toDate(),
        })
      }

      await batch.commit()
      return createdFeatures
    } catch (error: any) {
      console.error('[Features Repository] Error creating batch features:', error)
      throw new Error(`Error creando funcionalidades en batch: ${error.message}`)
    }
  }
}

export const featuresRepository = new FeaturesRepository()

