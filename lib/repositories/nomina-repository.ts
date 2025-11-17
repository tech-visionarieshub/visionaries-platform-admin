import { BaseRepository } from './base-repository';
import type { TeamMember } from '@/lib/mock-data/finanzas';

export interface NominaEntity extends TeamMember {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class NominaRepository extends BaseRepository<NominaEntity> {
  constructor() {
    super('nomina');
  }

  async getByFormaPago(formaPago: TeamMember['formaPago']): Promise<NominaEntity[]> {
    return this.query([
      (ref) => ref.where('formaPago', '==', formaPago),
    ]);
  }
}

export const nominaRepository = new NominaRepository();

