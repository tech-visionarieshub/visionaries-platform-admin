import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Project } from '@/lib/mock-data/projects';

const BASE_URL = '/api/projects';

export async function getProjects(params?: { clientId?: string; status?: Project['status'] }): Promise<Project[]> {
  return apiGet<Project[]>(BASE_URL, params as Record<string, string>);
}

export async function getProjectById(id: string): Promise<Project> {
  return apiGet<Project>(`${BASE_URL}/${id}`);
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
  return apiPost<Project>(BASE_URL, project);
}

export async function createProjectWithId(id: string, project: Omit<Project, 'id'>): Promise<Project> {
  return apiPost<Project>(BASE_URL, { id, ...project });
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  return apiPut<Project>(`${BASE_URL}/${id}`, updates);
}

export async function deleteProject(id: string): Promise<void> {
  return apiDelete(`${BASE_URL}/${id}`);
}

