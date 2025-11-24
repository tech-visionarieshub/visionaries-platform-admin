/**
 * Repositorio para gestionar Documentos del Proyecto en Firestore
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import admin from 'firebase-admin'

export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  type: string
  category: 'administrative' | 'client' | 'technical' | 'manuals' | 'legal'
  version?: string
  driveUrl: string
  lastModified: Date
  createdAt: Date
  createdBy: string
}

export class ProjectDocumentsRepository {
  private db = getInternalFirestore()

  /**
   * Obtiene la colección de documentos para un proyecto
   */
  private getDocumentsCollection(projectId: string) {
    return this.db.collection('projects').doc(projectId).collection('documents')
  }

  /**
   * Convierte un documento de Firestore a ProjectDocument
   */
  private fromFirestore(doc: admin.firestore.DocumentSnapshot): ProjectDocument {
    const data = doc.data()
    if (!data) {
      throw new Error(`Document ${doc.id} does not exist`)
    }

    return {
      id: doc.id,
      projectId: data.projectId,
      name: data.name,
      type: data.type || '',
      category: data.category,
      version: data.version,
      driveUrl: data.driveUrl,
      lastModified: data.lastModified?.toDate() || data.createdAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      createdBy: data.createdBy || '',
    }
  }

  /**
   * Crea un nuevo documento
   */
  async create(projectId: string, document: Omit<ProjectDocument, 'id' | 'createdAt' | 'lastModified'>): Promise<ProjectDocument> {
    try {
      const docRef = this.getDocumentsCollection(projectId).doc()
      
      // Remover campos undefined para evitar errores en Firestore
      const data: any = {
        projectId,
        name: document.name,
        type: document.type || '',
        category: document.category,
        driveUrl: document.driveUrl,
        lastModified: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: document.createdBy || '',
      }

      // Solo agregar version si está definido
      if (document.version !== undefined && document.version !== null && document.version !== '') {
        data.version = document.version
      }

      await docRef.set(data)

      const createdDoc = await docRef.get()
      return this.fromFirestore(createdDoc)
    } catch (error: any) {
      throw new Error(`Error creating document: ${error.message}`)
    }
  }

  /**
   * Obtiene todos los documentos de un proyecto
   */
  async getAll(projectId: string): Promise<ProjectDocument[]> {
    try {
      const snapshot = await this.getDocumentsCollection(projectId)
        .orderBy('lastModified', 'desc')
        .get()
      
      return snapshot.docs.map(doc => this.fromFirestore(doc))
    } catch (error: any) {
      throw new Error(`Error getting documents: ${error.message}`)
    }
  }

  /**
   * Obtiene un documento por ID
   */
  async getById(projectId: string, documentId: string): Promise<ProjectDocument | null> {
    try {
      const doc = await this.getDocumentsCollection(projectId).doc(documentId).get()
      
      if (!doc.exists) {
        return null
      }

      return this.fromFirestore(doc)
    } catch (error: any) {
      throw new Error(`Error getting document: ${error.message}`)
    }
  }

  /**
   * Actualiza un documento
   */
  async update(projectId: string, documentId: string, updates: Partial<Omit<ProjectDocument, 'id' | 'projectId' | 'createdAt' | 'createdBy'>>): Promise<ProjectDocument> {
    try {
      const docRef = this.getDocumentsCollection(projectId).doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error(`Document ${documentId} does not exist`)
      }

      const updateData: any = {
        lastModified: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Solo agregar campos que están definidos y no son undefined
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.type !== undefined) updateData.type = updates.type
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.driveUrl !== undefined) updateData.driveUrl = updates.driveUrl
      
      // Para version, solo agregar si está definido y no es vacío
      if (updates.version !== undefined) {
        if (updates.version === null || updates.version === '') {
          // Si se pasa null o string vacío, eliminar el campo
          updateData.version = admin.firestore.FieldValue.delete()
        } else {
          updateData.version = updates.version
        }
      }

      await docRef.update(updateData)

      const updatedDoc = await docRef.get()
      return this.fromFirestore(updatedDoc)
    } catch (error: any) {
      throw new Error(`Error updating document: ${error.message}`)
    }
  }

  /**
   * Elimina un documento
   */
  async delete(projectId: string, documentId: string): Promise<void> {
    try {
      const docRef = this.getDocumentsCollection(projectId).doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error(`Document ${documentId} does not exist`)
      }

      await docRef.delete()
    } catch (error: any) {
      throw new Error(`Error deleting document: ${error.message}`)
    }
  }
}

export const projectDocumentsRepository = new ProjectDocumentsRepository()

