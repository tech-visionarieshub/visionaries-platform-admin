/**
 * Repositorio para gestionar Status Reports en Firestore
 * Estructura: projects/{projectId}/status-reports/{reportId}
 */

import { getInternalFirestore } from '@/lib/firebase/admin-platform'
import admin from 'firebase-admin'

export interface StatusReport {
  id: string
  projectId: string
  weekStartDate: Date
  weekEndDate: Date
  subject: string
  content: string
  status: 'draft' | 'sent'
  sentTo?: string
  sentAt?: Date
  previewUrl?: string
  openRate?: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export class StatusReportsRepository {
  private db = getInternalFirestore()

  /**
   * Obtiene la referencia a la colección de status reports de un proyecto
   */
  private getReportsCollection(projectId: string) {
    return this.db.collection('projects').doc(projectId).collection('status-reports')
  }

  /**
   * Crea un nuevo status report
   */
  async create(projectId: string, report: Omit<StatusReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<StatusReport> {
    try {
      const reportsRef = this.getReportsCollection(projectId)
      const docRef = reportsRef.doc()

      const now = admin.firestore.Timestamp.now()
      const data = {
        ...report,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
        weekStartDate: admin.firestore.Timestamp.fromDate(
          report.weekStartDate instanceof Date ? report.weekStartDate : new Date(report.weekStartDate)
        ),
        weekEndDate: admin.firestore.Timestamp.fromDate(
          report.weekEndDate instanceof Date ? report.weekEndDate : new Date(report.weekEndDate)
        ),
        sentAt: report.sentAt
          ? admin.firestore.Timestamp.fromDate(
              report.sentAt instanceof Date ? report.sentAt : new Date(report.sentAt)
            )
          : null,
      }

      await docRef.set(data)

      return this.mapToStatusReport(docRef.id, data)
    } catch (error: any) {
      throw new Error(`Error creating status report: ${error.message}`)
    }
  }

  /**
   * Obtiene todos los status reports de un proyecto
   */
  async getAll(projectId: string): Promise<StatusReport[]> {
    try {
      const reportsRef = this.getReportsCollection(projectId)
      const snapshot = await reportsRef.orderBy('weekStartDate', 'desc').get()

      return snapshot.docs.map((doc) => this.mapToStatusReport(doc.id, doc.data()))
    } catch (error: any) {
      throw new Error(`Error getting status reports: ${error.message}`)
    }
  }

  /**
   * Obtiene un status report por ID
   */
  async getById(projectId: string, reportId: string): Promise<StatusReport | null> {
    try {
      const reportsRef = this.getReportsCollection(projectId)
      const doc = await reportsRef.doc(reportId).get()

      if (!doc.exists) {
        return null
      }

      return this.mapToStatusReport(doc.id, doc.data())
    } catch (error: any) {
      throw new Error(`Error getting status report: ${error.message}`)
    }
  }

  /**
   * Actualiza un status report
   */
  async update(projectId: string, reportId: string, updates: Partial<Omit<StatusReport, 'id' | 'projectId' | 'createdAt' | 'createdBy'>>): Promise<void> {
    try {
      const reportsRef = this.getReportsCollection(projectId)
      const docRef = reportsRef.doc(reportId)

      const updateData: any = {
        ...updates,
        updatedAt: admin.firestore.Timestamp.now(),
      }

      if (updates.weekStartDate) {
        updateData.weekStartDate = admin.firestore.Timestamp.fromDate(
          updates.weekStartDate instanceof Date ? updates.weekStartDate : new Date(updates.weekStartDate)
        )
      }

      if (updates.weekEndDate) {
        updateData.weekEndDate = admin.firestore.Timestamp.fromDate(
          updates.weekEndDate instanceof Date ? updates.weekEndDate : new Date(updates.weekEndDate)
        )
      }

      if (updates.sentAt) {
        updateData.sentAt = admin.firestore.Timestamp.fromDate(
          updates.sentAt instanceof Date ? updates.sentAt : new Date(updates.sentAt)
        )
      }

      await docRef.update(updateData)
    } catch (error: any) {
      throw new Error(`Error updating status report: ${error.message}`)
    }
  }

  /**
   * Elimina un status report
   */
  async delete(projectId: string, reportId: string): Promise<void> {
    try {
      const reportsRef = this.getReportsCollection(projectId)
      await reportsRef.doc(reportId).delete()
    } catch (error: any) {
      throw new Error(`Error deleting status report: ${error.message}`)
    }
  }

  /**
   * Obtiene el último reporte de un proyecto
   */
  async getLatest(projectId: string): Promise<StatusReport | null> {
    try {
      const reportsRef = this.getReportsCollection(projectId)
      const snapshot = await reportsRef.orderBy('weekStartDate', 'desc').limit(1).get()

      if (snapshot.empty) {
        return null
      }

      return this.mapToStatusReport(snapshot.docs[0].id, snapshot.docs[0].data())
    } catch (error: any) {
      throw new Error(`Error getting latest status report: ${error.message}`)
    }
  }

  /**
   * Mapea datos de Firestore a StatusReport
   */
  private mapToStatusReport(id: string, data: any): StatusReport {
    return {
      id,
      projectId: data.projectId,
      weekStartDate: data.weekStartDate?.toDate() || new Date(data.weekStartDate),
      weekEndDate: data.weekEndDate?.toDate() || new Date(data.weekEndDate),
      subject: data.subject,
      content: data.content,
      status: data.status || 'draft',
      sentTo: data.sentTo,
      sentAt: data.sentAt?.toDate() || (data.sentAt ? new Date(data.sentAt) : undefined),
      previewUrl: data.previewUrl,
      openRate: data.openRate,
      createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt),
      createdBy: data.createdBy,
    }
  }
}

export const statusReportsRepository = new StatusReportsRepository()

