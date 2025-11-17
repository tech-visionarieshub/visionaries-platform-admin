import { getInternalFirestore } from '@/lib/firebase/admin-platform';
import admin from 'firebase-admin';
import type { CotizacionesConfig } from '@/lib/mock-data/cotizaciones-config';

const CONFIG_DOC_ID = 'cotizaciones';

export class ConfigRepository {
  private db: admin.firestore.Firestore;
  private docRef: admin.firestore.DocumentReference;

  constructor() {
    this.db = getInternalFirestore();
    this.docRef = this.db.collection('config').doc(CONFIG_DOC_ID);
  }

  /**
   * Obtiene la configuración de cotizaciones
   */
  async get(): Promise<CotizacionesConfig | null> {
    try {
      const doc = await this.docRef.get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as CotizacionesConfig;
    } catch (error: any) {
      throw new Error(`Error getting config: ${error.message}`);
    }
  }

  /**
   * Guarda la configuración de cotizaciones
   */
  async save(config: CotizacionesConfig): Promise<CotizacionesConfig> {
    try {
      const data = {
        ...config,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await this.docRef.set(data, { merge: true });
      
      const doc = await this.docRef.get();
      return doc.data() as CotizacionesConfig;
    } catch (error: any) {
      throw new Error(`Error saving config: ${error.message}`);
    }
  }

  /**
   * Resetea la configuración (elimina el documento)
   */
  async reset(): Promise<void> {
    try {
      await this.docRef.delete();
    } catch (error: any) {
      throw new Error(`Error resetting config: ${error.message}`);
    }
  }
}

export const configRepository = new ConfigRepository();

