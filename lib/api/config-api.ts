import { apiGet, apiPut, apiDelete } from './client';
import type { CotizacionesConfig } from '@/lib/mock-data/cotizaciones-config';

const BASE_URL = '/api/config/cotizaciones';

export async function getCotizacionesConfig(): Promise<CotizacionesConfig> {
  return apiGet<CotizacionesConfig>(BASE_URL);
}

export async function saveCotizacionesConfig(config: CotizacionesConfig): Promise<CotizacionesConfig> {
  return apiPut<CotizacionesConfig>(BASE_URL, config);
}

export async function resetCotizacionesConfig(): Promise<void> {
  return apiDelete(BASE_URL);
}

