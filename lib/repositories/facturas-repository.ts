import { BaseRepository } from './base-repository';
import type { Factura } from '@/lib/mock-data/finanzas';

export interface FacturaEntity extends Factura {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class FacturasRepository extends BaseRepository<FacturaEntity> {
  constructor() {
    super('facturas');
  }

  async getByStatus(status: Factura['status']): Promise<FacturaEntity[]> {
    return this.query([
      (ref) => ref.where('status', '==', status),
    ]);
  }

  async getByEmpresa(empresa: string): Promise<FacturaEntity[]> {
    return this.query([
      (ref) => ref.where('empresa', '==', empresa),
    ]);
  }

  async getByMesFacturacion(mes: string): Promise<FacturaEntity[]> {
    return this.query([
      (ref) => ref.where('mesFacturacion', '==', mes),
    ]);
  }

  async getByFolio(folio: string): Promise<FacturaEntity | null> {
    return this.queryOne([
      (ref) => ref.where('folio', '==', folio),
    ]);
  }
}

export const facturasRepository = new FacturasRepository();

