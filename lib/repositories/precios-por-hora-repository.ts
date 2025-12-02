import { BaseRepository } from './base-repository';
import type { PrecioPorHora } from '@/lib/mock-data/finanzas';

export interface PrecioPorHoraEntity extends PrecioPorHora {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class PreciosPorHoraRepository extends BaseRepository<PrecioPorHoraEntity> {
  constructor() {
    super('precios-por-hora');
  }

  async getByPersonaEmail(email: string): Promise<PrecioPorHoraEntity | null> {
    return this.queryOne([
      (ref) => ref.where('personaEmail', '==', email),
    ]);
  }

  async getAll(): Promise<PrecioPorHoraEntity[]> {
    return this.query([]);
  }
}

export const preciosPorHoraRepository = new PreciosPorHoraRepository();

