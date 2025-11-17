import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { CotizacionTemplate } from '@/lib/mock-data/cotizaciones-templates';

const BASE_URL = '/api/templates';

export async function getTemplates(params?: { tipoProyecto?: CotizacionTemplate['tipoProyecto']; predefinido?: boolean }): Promise<CotizacionTemplate[]> {
  const queryParams: Record<string, string> = {};
  if (params?.tipoProyecto) {
    queryParams.tipoProyecto = params.tipoProyecto;
  }
  if (params?.predefinido !== undefined) {
    queryParams.predefinido = params.predefinido.toString();
  }
  return apiGet<CotizacionTemplate[]>(BASE_URL, queryParams);
}

export async function getTemplateById(id: string): Promise<CotizacionTemplate> {
  return apiGet<CotizacionTemplate>(`${BASE_URL}/${id}`);
}

export async function createTemplate(template: Omit<CotizacionTemplate, 'id'>): Promise<CotizacionTemplate> {
  return apiPost<CotizacionTemplate>(BASE_URL, template);
}

export async function createTemplateWithId(id: string, template: Omit<CotizacionTemplate, 'id'>): Promise<CotizacionTemplate> {
  return apiPost<CotizacionTemplate>(BASE_URL, { id, ...template });
}

export async function updateTemplate(id: string, updates: Partial<CotizacionTemplate>): Promise<CotizacionTemplate> {
  return apiPut<CotizacionTemplate>(`${BASE_URL}/${id}`, updates);
}

export async function deleteTemplate(id: string): Promise<void> {
  return apiDelete(`${BASE_URL}/${id}`);
}

