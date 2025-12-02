import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import admin from 'firebase-admin';

export interface BaseEntity {
  id: string;
  createdAt?: admin.firestore.Timestamp | Date | string;
  updatedAt?: admin.firestore.Timestamp | Date | string;
}

export class BaseRepository<T extends BaseEntity> {
  protected db: admin.firestore.Firestore;
  protected collectionName: string;

  constructor(collectionName: string) {
    this.db = getInternalFirestore();
    this.collectionName = collectionName;
  }

  protected getCollection(): admin.firestore.CollectionReference {
    return this.db.collection(this.collectionName);
  }

  protected getDoc(id: string): admin.firestore.DocumentReference {
    return this.getCollection().doc(id);
  }

  /**
   * Convierte un documento de Firestore a un objeto plano
   */
  protected fromFirestore(doc: admin.firestore.DocumentSnapshot): T {
    const data = doc.data();
    if (!data) {
      throw new Error(`Document ${doc.id} does not exist`);
    }

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as T;
  }

  /**
   * Convierte un objeto a formato Firestore (convierte timestamps)
   * Remueve campos undefined para evitar errores de Firestore
   */
  protected toFirestore(data: Partial<T>): any {
    const { id, ...rest } = data as any;
    const firestoreData: any = { ...rest };

    // Remover campos undefined (pero mantener null para eliminar campos en Firestore)
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key] === undefined) {
        delete firestoreData[key];
      } else if (firestoreData[key] === null) {
        // Convertir null a FieldValue.delete() para eliminar el campo en Firestore
        firestoreData[key] = admin.firestore.FieldValue.delete();
      }
    });

    // Si createdAt no existe, agregarlo
    if (!firestoreData.createdAt) {
      firestoreData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Siempre actualizar updatedAt
    firestoreData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    return firestoreData;
  }

  /**
   * Crea un nuevo documento
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const docRef = this.getCollection().doc();
      const firestoreData = this.toFirestore(data as Partial<T>);
      
      await docRef.set(firestoreData);
      
      const doc = await docRef.get();
      return this.fromFirestore(doc);
    } catch (error: any) {
      throw new Error(`Error creating document in ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Crea un documento con ID específico
   */
  async createWithId(id: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const docRef = this.getDoc(id);
      const firestoreData = this.toFirestore(data as Partial<T>);
      
      await docRef.set(firestoreData);
      
      const doc = await docRef.get();
      return this.fromFirestore(doc);
    } catch (error: any) {
      throw new Error(`Error creating document with ID ${id} in ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Obtiene un documento por ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const doc = await this.getDoc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return this.fromFirestore(doc);
    } catch (error: any) {
      throw new Error(`Error getting document ${id} from ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los documentos
   */
  async getAll(): Promise<T[]> {
    try {
      const snapshot = await this.getCollection().get();
      return snapshot.docs.map(doc => this.fromFirestore(doc));
    } catch (error: any) {
      throw new Error(`Error getting all documents from ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Actualiza un documento
   */
  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    try {
      const docRef = this.getDoc(id);
      const firestoreData = this.toFirestore(updates as Partial<T>);
      
      await docRef.update(firestoreData);
      
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error(`Document ${id} does not exist`);
      }

      return this.fromFirestore(doc);
    } catch (error: any) {
      if (error.code === 5) { // NOT_FOUND
        throw new Error(`Document ${id} does not exist`);
      }
      throw new Error(`Error updating document ${id} in ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Elimina un documento
   */
  async delete(id: string): Promise<void> {
    try {
      await this.getDoc(id).delete();
    } catch (error: any) {
      throw new Error(`Error deleting document ${id} from ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Consulta documentos con filtros
   */
  async query(
    constraints: Array<(ref: admin.firestore.CollectionReference) => admin.firestore.Query>
  ): Promise<T[]> {
    try {
      let query: admin.firestore.Query = this.getCollection();
      
      for (const constraint of constraints) {
        query = constraint(query as any);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.fromFirestore(doc));
    } catch (error: any) {
      throw new Error(`Error querying ${this.collectionName}: ${error.message}`);
    }
  }

  /**
   * Consulta un documento único
   */
  async queryOne(
    constraints: Array<(ref: admin.firestore.CollectionReference) => admin.firestore.Query>
  ): Promise<T | null> {
    try {
      let query: admin.firestore.Query = this.getCollection();
      
      for (const constraint of constraints) {
        query = constraint(query as any);
      }

      const snapshot = await query.limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }

      return this.fromFirestore(snapshot.docs[0]);
    } catch (error: any) {
      throw new Error(`Error querying ${this.collectionName}: ${error.message}`);
    }
  }
}

