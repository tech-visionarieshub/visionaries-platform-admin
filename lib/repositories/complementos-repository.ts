import { BaseRepository } from './base-repository';
import type { Complemento } from '@/lib/mock-data/finanzas';

export interface ComplementoEntity extends Complemento {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class ComplementosRepository extends BaseRepository<ComplementoEntity> {
  constructor() {
    super('complementos');
  }

  async getByFacturaId(facturaId: string): Promise<ComplementoEntity[]> {
    return this.query([
      (ref) => ref.where('facturaId', '==', facturaId),
    ]);
  }

  async getByStatus(status: Complemento['status']): Promise<ComplementoEntity[]> {
    return this.query([
      (ref) => ref.where('status', '==', status),
    ]);
  }

  async getByMesFacturacion(mes: string): Promise<ComplementoEntity[]> {
    return this.query([
      (ref) => ref.where('mesFacturacion', '==', mes),
    ]);
  }
}

export const complementosRepository = new ComplementosRepository();

