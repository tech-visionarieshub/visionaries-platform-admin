import { BaseRepository } from './base-repository';

export interface ClienteEntity {
  id: string;
  empresa: string;
  personaCobranza: string;
  correoCobranza: string;
  ccCobranza?: string;
  cuentaPago: string;
  datosPago: string;
  razonSocial: string;
  rfc: string;
  cp: string;
  regimenFiscal: string;
  usoCFDI: string;
  calle: string;
  colonia: string;
  localidad: string;
  noExterior: string;
  noInterior?: string;
  municipio: string;
  estado: string;
  pais: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class ClientesRepository extends BaseRepository<ClienteEntity> {
  constructor() {
    super('clientes');
  }

  async getByRfc(rfc: string): Promise<ClienteEntity | null> {
    return this.queryOne([
      (ref) => ref.where('rfc', '==', rfc),
    ]);
  }

  async getByEmpresa(empresa: string): Promise<ClienteEntity | null> {
    return this.queryOne([
      (ref) => ref.where('empresa', '==', empresa),
    ]);
  }
}

export const clientesRepository = new ClientesRepository();

