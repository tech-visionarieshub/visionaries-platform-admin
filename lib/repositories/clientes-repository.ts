import { BaseRepository } from './base-repository';

export interface ClienteEntity {
  id: string;
  empresa: string;
  personaCobranza: string;
  correoCobranza: string;
  ccCobranza?: string;
  cuentaPago?: string;
  datosPago?: string;
  razonSocial: string;
  rfc: string;
  cp?: string;
  regimenFiscal?: string;
  usoCFDI?: string;
  calle?: string;
  colonia?: string;
  localidad?: string;
  noExterior?: string;
  noInterior?: string;
  municipio?: string;
  estado?: string;
  pais?: string;
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

  /**
   * Crea múltiples clientes en batch
   */
  async bulkCreate(clientes: Array<Omit<ClienteEntity, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ClienteEntity[]> {
    try {
      const batch = this.db.batch();
      const createdClientes: ClienteEntity[] = [];

      for (const cliente of clientes) {
        const docRef = this.getCollection().doc();
        const firestoreData = this.toFirestore(cliente as Partial<ClienteEntity>);
        batch.set(docRef, firestoreData);
        
        // Guardar referencia para obtener después
        createdClientes.push({
          id: docRef.id,
          ...cliente,
        } as ClienteEntity);
      }

      await batch.commit();

      // Obtener los documentos creados
      const results = await Promise.all(
        createdClientes.map(cliente => this.getById(cliente.id))
      );

      return results.filter((cliente): cliente is ClienteEntity => cliente !== null);
    } catch (error: any) {
      throw new Error(`Error creating bulk clientes: ${error.message}`);
    }
  }
}

export const clientesRepository = new ClientesRepository();

