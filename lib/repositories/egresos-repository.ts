import { BaseRepository } from './base-repository';
import type { Egreso } from '@/lib/mock-data/finanzas';

export interface EgresoEntity extends Egreso {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class EgresosRepository extends BaseRepository<EgresoEntity> {
  constructor() {
    super('egresos');
  }

  async getByStatus(status: Egreso['status']): Promise<EgresoEntity[]> {
    return this.query([
      (ref) => ref.where('status', '==', status),
    ]);
  }

  async getByTipo(tipo: Egreso['tipo']): Promise<EgresoEntity[]> {
    return this.query([
      (ref) => ref.where('tipo', '==', tipo),
    ]);
  }

  async getByMes(mes: string): Promise<EgresoEntity[]> {
    return this.query([
      (ref) => ref.where('mes', '==', mes),
    ]);
  }

  async getByCategoria(categoria: string): Promise<EgresoEntity[]> {
    return this.query([
      (ref) => ref.where('categoria', '==', categoria),
    ]);
  }

  async getByLineaNegocio(lineaNegocio: string): Promise<EgresoEntity[]> {
    return this.query([
      (ref) => ref.where('lineaNegocio', '==', lineaNegocio),
    ]);
  }

  /**
   * Obtiene solo egresos basados en horas
   */
  async getBasadosEnHoras(): Promise<EgresoEntity[]> {
    return this.query([
      (ref) => ref.where('tipoEgreso', '==', 'basadoEnHoras'),
    ]);
  }

  /**
   * Crea múltiples egresos en batch
   */
  async bulkCreate(egresos: Array<Omit<EgresoEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EgresoEntity[]> {
    try {
      const batch = this.db.batch();
      const createdEgresos: EgresoEntity[] = [];

      for (const egreso of egresos) {
        const docRef = this.getCollection().doc();
        const firestoreData = this.toFirestore(egreso as Partial<EgresoEntity>);
        batch.set(docRef, firestoreData);
        
        // Guardar referencia para obtener después
        createdEgresos.push({
          id: docRef.id,
          ...egreso,
        } as EgresoEntity);
      }

      await batch.commit();

      // Obtener los documentos creados
      const results = await Promise.all(
        createdEgresos.map(egreso => this.getById(egreso.id))
      );

      return results.filter((egreso): egreso is EgresoEntity => egreso !== null);
    } catch (error: any) {
      throw new Error(`Error creating bulk egresos: ${error.message}`);
    }
  }
}

export const egresosRepository = new EgresosRepository();

