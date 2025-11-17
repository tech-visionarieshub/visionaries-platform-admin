import { BaseRepository } from './base-repository';
import type { Cotizacion, EstadoCotizacion } from '@/lib/mock-data/cotizaciones';

export interface CotizacionEntity extends Cotizacion {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class CotizacionesRepository extends BaseRepository<CotizacionEntity> {
  constructor() {
    super('cotizaciones');
  }

  async getByClienteId(clienteId: string): Promise<CotizacionEntity[]> {
    return this.query([
      (ref) => ref.where('clienteId', '==', clienteId),
    ]);
  }

  async getByEstado(estado: EstadoCotizacion): Promise<CotizacionEntity[]> {
    return this.query([
      (ref) => ref.where('estado', '==', estado),
    ]);
  }

  async getByFolio(folio: string): Promise<CotizacionEntity | null> {
    return this.queryOne([
      (ref) => ref.where('folio', '==', folio),
    ]);
  }

  async getByTemplateId(templateId: string): Promise<CotizacionEntity[]> {
    return this.query([
      (ref) => ref.where('templateId', '==', templateId),
    ]);
  }
}

export const cotizacionesRepository = new CotizacionesRepository();

