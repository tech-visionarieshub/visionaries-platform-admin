/**
 * Repositorio para gestionar Team Tasks (Tareas del Equipo) en Firestore
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import admin from 'firebase-admin'
import type { TeamTask } from '@/types/team-task'
import { Timestamp } from 'firebase-admin/firestore'

export class TeamTasksRepository {
  private db = getInternalFirestore()

  /**
   * Obtiene la colección de team tasks
   */
  private getTeamTasksCollection() {
    return this.db.collection('team-tasks')
  }

  /**
   * Genera un ID único para una tarea
   */
  private async generateTaskId(): Promise<string> {
    try {
      // Contar tareas existentes para obtener el siguiente número
      const existingTasks = await this.getTeamTasksCollection().get()
      const nextTaskNum = existingTasks.size + 1
      
      // Formato: TASK-{NUM}
      return `TASK-${nextTaskNum}`
    } catch (error: any) {
      console.error('[Team Tasks Repository] Error generating ID:', error)
      // Fallback: usar timestamp si falla
      return `TASK-${Date.now()}`
    }
  }

  /**
   * Convierte un documento de Firestore a TeamTask
   */
  private fromFirestore(doc: admin.firestore.DocumentSnapshot): TeamTask {
    const data = doc.data()
    if (!data) {
      throw new Error(`Team Task ${doc.id} does not exist`)
    }

    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      customCategory: data.customCategory,
      status: data.status,
      priority: data.priority,
      assignee: data.assignee,
      projectId: data.projectId,
      projectName: data.projectName,
      dueDate: data.dueDate?.toDate?.() || (data.dueDate as Date | undefined),
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      startedAt: data.startedAt?.toDate?.() || (data.startedAt as Date | undefined),
      accumulatedTime: data.accumulatedTime || 0,
      comentarios: data.comentarios,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.() || (data.createdAt as Date),
      updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt as Date),
    }
  }

  /**
   * Convierte TeamTask a formato Firestore
   */
  private toFirestore(task: Partial<TeamTask>): any {
    const { id, ...data } = task as any
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
      if (firestoreData.startedAt === null) {
        firestoreData.startedAt = null
      }
    }

    // Convertir dueDate a Timestamp si es Date
    if (firestoreData.dueDate instanceof Date) {
      firestoreData.dueDate = Timestamp.fromDate(firestoreData.dueDate)
    } else if (firestoreData.dueDate === null || firestoreData.dueDate === undefined) {
      if (firestoreData.dueDate === null) {
        firestoreData.dueDate = null
      }
    }

    return firestoreData
  }

  /**
   * Crea una nueva tarea del equipo
   */
  async create(taskData: Omit<TeamTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamTask> {
    const id = await this.generateTaskId()
    const now = new Date()
    
    const task: TeamTask = {
      ...taskData,
      id,
      createdAt: now,
      updatedAt: now,
    }

    const firestoreData = this.toFirestore(task)
    await this.getTeamTasksCollection().doc(id).set(firestoreData)

    return task
  }

  /**
   * Obtiene una tarea por ID
   */
  async getById(id: string): Promise<TeamTask | null> {
    const doc = await this.getTeamTasksCollection().doc(id).get()
    if (!doc.exists) {
      return null
    }
    return this.fromFirestore(doc)
  }

  /**
   * Obtiene todas las tareas, opcionalmente filtradas
   */
  async getAll(filters?: {
    status?: TeamTask['status']
    assignee?: string
    projectId?: string
    category?: TeamTask['category']
  }): Promise<TeamTask[]> {
    let query: admin.firestore.Query = this.getTeamTasksCollection()

    if (filters?.status) {
      query = query.where('status', '==', filters.status)
    }
    if (filters?.assignee) {
      query = query.where('assignee', '==', filters.assignee)
    }
    if (filters?.projectId) {
      query = query.where('projectId', '==', filters.projectId)
    }
    if (filters?.category) {
      query = query.where('category', '==', filters.category)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get()
    return snapshot.docs.map(doc => this.fromFirestore(doc))
  }

  /**
   * Obtiene tareas por responsable
   */
  async getByAssignee(assignee: string): Promise<TeamTask[]> {
    return this.getAll({ assignee })
  }

  /**
   * Obtiene tareas por proyecto
   */
  async getByProject(projectId: string): Promise<TeamTask[]> {
    return this.getAll({ projectId })
  }

  /**
   * Obtiene tareas por categoría
   */
  async getByCategory(category: TeamTask['category']): Promise<TeamTask[]> {
    return this.getAll({ category })
  }

  /**
   * Actualiza una tarea
   */
  async update(id: string, updates: Partial<Omit<TeamTask, 'id' | 'createdAt'>>): Promise<TeamTask> {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    }

    const firestoreData = this.toFirestore(updatesWithTimestamp)
    await this.getTeamTasksCollection().doc(id).update(firestoreData)

    const updated = await this.getById(id)
    if (!updated) {
      throw new Error(`Team Task ${id} not found after update`)
    }
    return updated
  }

  /**
   * Elimina una tarea
   */
  async delete(id: string): Promise<void> {
    await this.getTeamTasksCollection().doc(id).delete()
  }

  /**
   * Busca tareas similares por título (para verificar duplicados)
   */
  async findSimilarTasks(title: string, limit: number = 10): Promise<TeamTask[]> {
    // Obtener todas las tareas y filtrar por similitud en el cliente
    // Nota: Firestore no tiene búsqueda de texto completo, así que hacemos una búsqueda básica
    const allTasks = await this.getAll()
    
    const titleLower = title.toLowerCase().trim()
    const similarTasks = allTasks
      .filter(task => {
        const taskTitleLower = task.title.toLowerCase().trim()
        // Verificar si el título contiene palabras similares
        return taskTitleLower.includes(titleLower) || titleLower.includes(taskTitleLower)
      })
      .slice(0, limit)

    return similarTasks
  }

  /**
   * Busca una tarea por Trello Card ID
   */
  async findByTrelloCardId(trelloCardId: string): Promise<TeamTask | null> {
    const snapshot = await this.getTeamTasksCollection()
      .where('trelloCardId', '==', trelloCardId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    return this.fromFirestore(snapshot.docs[0])
  }
}

export const teamTasksRepository = new TeamTasksRepository()



