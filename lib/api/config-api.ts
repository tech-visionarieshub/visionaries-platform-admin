import { apiGet, apiPut, apiDelete } from './client';
import type { CotizacionesConfig } from '@/lib/mock-data/cotizaciones-config';

const BASE_URL = '/api/config/cotizaciones';

export async function getCotizacionesConfig(): Promise<CotizacionesConfig | null> {
  try {
    console.log('[Config API] Obteniendo configuración desde:', BASE_URL);
    const config = await apiGet<CotizacionesConfig>(BASE_URL);
    console.log('[Config API] Configuración obtenida exitosamente:', config);
    return config;
  } catch (error: any) {
    console.error('[Config API] Error fetching config:', error);
    console.error('[Config API] Error name:', error?.name);
    console.error('[Config API] Error message:', error?.message);
    console.error('[Config API] Error stack:', error?.stack);
    // Re-lanzar el error para que el componente pueda manejarlo
    throw error;
  }
}

export async function saveCotizacionesConfig(config: CotizacionesConfig): Promise<CotizacionesConfig> {
  return apiPut<CotizacionesConfig>(BASE_URL, config);
}

export async function resetCotizacionesConfig(): Promise<void> {
  return apiDelete(BASE_URL);
}

