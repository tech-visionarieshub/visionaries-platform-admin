import { BaseRepository } from './base-repository';
import type { CotizacionTemplate } from '@/lib/mock-data/cotizaciones-templates';

export interface TemplateEntity extends CotizacionTemplate {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class TemplatesRepository extends BaseRepository<TemplateEntity> {
  constructor() {
    super('cotizaciones-templates');
  }

  async getByTipoProyecto(tipoProyecto: CotizacionTemplate['tipoProyecto']): Promise<TemplateEntity[]> {
    return this.query([
      (ref) => ref.where('tipoProyecto', '==', tipoProyecto),
    ]);
  }

  async getPredefinidos(): Promise<TemplateEntity[]> {
    return this.query([
      (ref) => ref.where('predefinido', '==', true),
    ]);
  }
}

export const templatesRepository = new TemplatesRepository();

