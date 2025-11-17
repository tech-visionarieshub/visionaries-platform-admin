import { BaseRepository } from './base-repository';
import type { Project } from '@/lib/mock-data/projects';

export interface ProjectEntity extends Project {
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export class ProjectsRepository extends BaseRepository<ProjectEntity> {
  constructor() {
    super('projects');
  }

  async getByClientId(clientId: string): Promise<ProjectEntity[]> {
    return this.query([
      (ref) => ref.where('clientId', '==', clientId),
    ]);
  }

  async getByStatus(status: Project['status']): Promise<ProjectEntity[]> {
    return this.query([
      (ref) => ref.where('status', '==', status),
    ]);
  }

  async getByCotizacionId(cotizacionId: string): Promise<ProjectEntity | null> {
    return this.queryOne([
      (ref) => ref.where('cotizacionId', '==', cotizacionId),
    ]);
  }
}

export const projectsRepository = new ProjectsRepository();

