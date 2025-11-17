import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Cotizacion, EstadoCotizacion } from '@/lib/mock-data/cotizaciones';
import type { Project } from '@/lib/mock-data/projects';

const BASE_URL = '/api/cotizaciones';

export async function getCotizaciones(params?: { clienteId?: string; estado?: EstadoCotizacion }): Promise<Cotizacion[]> {
  return apiGet<Cotizacion[]>(BASE_URL, params as Record<string, string>);
}

export async function getCotizacionById(id: string): Promise<Cotizacion> {
  return apiGet<Cotizacion>(`${BASE_URL}/${id}`);
}

export async function createCotizacion(cotizacion: Omit<Cotizacion, 'id'>): Promise<Cotizacion> {
  return apiPost<Cotizacion>(BASE_URL, cotizacion);
}

export async function createCotizacionWithId(id: string, cotizacion: Omit<Cotizacion, 'id'>): Promise<Cotizacion> {
  return apiPost<Cotizacion>(BASE_URL, { id, ...cotizacion });
}

export async function updateCotizacion(id: string, updates: Partial<Cotizacion>): Promise<Cotizacion> {
  return apiPut<Cotizacion>(`${BASE_URL}/${id}`, updates);
}

export async function deleteCotizacion(id: string): Promise<void> {
  return apiDelete(`${BASE_URL}/${id}`);
}

export async function convertCotizacionToProject(id: string): Promise<Project> {
  return apiPost<Project>(`${BASE_URL}/${id}/convert`, {});
}

