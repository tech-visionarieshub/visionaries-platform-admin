import { apiGet, apiPut, apiDelete } from './client';
import type { CotizacionesConfig } from '@/lib/mock-data/cotizaciones-config';

const BASE_URL = '/api/config/cotizaciones';

export async function getCotizacionesConfig(): Promise<CotizacionesConfig | null> {
  try {
    return await apiGet<CotizacionesConfig>(BASE_URL);
  } catch (error) {
    console.error('[Config API] Error fetching config:', error);
    return null;
  }
}

export async function saveCotizacionesConfig(config: CotizacionesConfig): Promise<CotizacionesConfig> {
  return apiPut<CotizacionesConfig>(BASE_URL, config);
}

export async function resetCotizacionesConfig(): Promise<void> {
  return apiDelete(BASE_URL);
}

