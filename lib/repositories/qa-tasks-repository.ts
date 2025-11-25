/**
 * Repositorio para gestionar QA Tasks en Firestore
 * Estructura: projects/{projectId}/qa-tasks/{taskId}
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import { QATask, QATaskCategory, QATaskStatus } from '@/types/qa'
import { Timestamp } from 'firebase-admin/firestore'

export class QATasksRepository {
  private db = getInternalFirestore()

  /**
   * Obtiene la referencia a la colección de QA tasks de un proyecto
   */
  private getTasksCollection(projectId: string) {
    return this.db.collection('projects').doc(projectId).collection('qa-tasks')
  }

  /**
   * Crea una nueva tarea QA
   */
  async create(projectId: string, task: Omit<QATask, 'id' | 'createdAt' | 'updatedAt'>): Promise<QATask> {
    const tasksRef = this.getTasksCollection(projectId)
    const docRef = tasksRef.doc()
    
    const now = Timestamp.now()
    const newTask: Omit<QATask, 'id'> & { createdAt: Timestamp; updatedAt: Timestamp } = {
      ...task,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(newTask)

    return {
      ...newTask,
      id: docRef.id,
      createdAt: newTask.createdAt.toDate(),
      updatedAt: newTask.updatedAt.toDate(),
    }
  }

  /**
   * Obtiene una tarea QA por ID
   */
  async getById(projectId: string, taskId: string): Promise<QATask | null> {
    const docRef = this.getTasksCollection(projectId).doc(taskId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      imagenes: (data.imagenes || []).map((img: any) => ({
        ...img,
        uploadedAt: img.uploadedAt?.toDate() || new Date(),
      })),
    } as QATask
  }

  /**
   * Obtiene todas las tareas QA de un proyecto
   */
  async getAll(projectId: string): Promise<QATask[]> {
    const snapshot = await this.getTasksCollection(projectId).get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        imagenes: (data.imagenes || []).map((img: any) => ({
          ...img,
          uploadedAt: img.uploadedAt?.toDate() || new Date(),
        })),
      } as QATask
    })
  }

  /**
   * Actualiza una tarea QA
   */
  async update(
    projectId: string,
    taskId: string,
    updates: Partial<Omit<QATask, 'id' | 'createdAt' | 'projectId'>>
  ): Promise<QATask> {
    const docRef = this.getTasksCollection(projectId).doc(taskId)
    
    // Filtrar campos undefined para evitar problemas con Firestore
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
    
    const updateData = {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    }

    console.log('[QATasksRepository] Actualizando tarea:', {
      projectId,
      taskId,
      updateData,
      estado: updateData.estado,
    })

    await docRef.update(updateData)

    const updated = await this.getById(projectId, taskId)
    if (!updated) {
      throw new Error('Tarea no encontrada después de actualizar')
    }

    console.log('[QATasksRepository] Tarea actualizada exitosamente:', {
      taskId,
      estadoGuardado: updated.estado,
    })

    return updated
  }

  /**
   * Elimina una tarea QA
   */
  async delete(projectId: string, taskId: string): Promise<void> {
    const docRef = this.getTasksCollection(projectId).doc(taskId)
    await docRef.delete()
  }

  /**
   * Crea múltiples tareas QA en batch
   */
  async createBatch(projectId: string, tasks: Omit<QATask, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<QATask[]> {
    const tasksRef = this.getTasksCollection(projectId)
    const batch = this.db.batch()
    const now = Timestamp.now()

    const createdTasks: QATask[] = []

    tasks.forEach(task => {
      const docRef = tasksRef.doc()
      const newTask = {
        ...task,
        createdAt: now,
        updatedAt: now,
      }
      batch.set(docRef, newTask)
      createdTasks.push({
        ...newTask,
        id: docRef.id,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      } as QATask)
    })

    await batch.commit()
    return createdTasks
  }

  /**
   * Filtra tareas por categoría
   */
  async getByCategory(projectId: string, category: QATaskCategory): Promise<QATask[]> {
    const snapshot = await this.getTasksCollection(projectId)
      .where('categoria', '==', category)
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        imagenes: (data.imagenes || []).map((img: any) => ({
          ...img,
          uploadedAt: img.uploadedAt?.toDate() || new Date(),
        })),
      } as QATask
    })
  }

  /**
   * Filtra tareas por estado
   */
  async getByStatus(projectId: string, status: QATaskStatus): Promise<QATask[]> {
    const snapshot = await this.getTasksCollection(projectId)
      .where('estado', '==', status)
      .get()

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
        imagenes: (data.imagenes || []).map((img: any) => ({
          ...img,
          uploadedAt: img.uploadedAt?.toDate() || new Date(),
        })),
      } as QATask
    })
  }
}

export const qaTasksRepository = new QATasksRepository()
