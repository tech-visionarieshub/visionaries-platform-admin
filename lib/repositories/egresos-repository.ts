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
}

export const egresosRepository = new EgresosRepository();

