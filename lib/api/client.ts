import { getIdToken } from '@/lib/firebase/visionaries-tech';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Cliente API base para hacer peticiones autenticadas
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Intentar obtener token de Firebase Auth primero
    let token = await getIdToken();
    
    // Si no hay token de Firebase, intentar usar el token guardado en sessionStorage
    if (!token && typeof window !== 'undefined') {
      const savedToken = sessionStorage.getItem('portalAuthToken');
      if (savedToken) {
        token = savedToken;
      }
    }
    
    if (!token) {
      // Si no hay token, redirigir al login solo si no estamos ya en login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          // Esperar un poco para que el layout-wrapper termine de validar
          setTimeout(() => {
            if (!sessionStorage.getItem('portalAuthToken')) {
              window.location.href = '/login';
            }
          }, 1000);
        }
      }
      throw new AuthenticationError('No authentication token available. Please log in.');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Si es error 401, redirigir al login
      if (response.status === 401 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    // No loggear errores de autenticación que ya redirigen
    if (!(error instanceof AuthenticationError)) {
      console.error(`[API Client] Error in ${endpoint}:`, error);
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(endpoint, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await apiRequest<T>(url.toString(), {
    method: 'GET',
  });

  return response.data as T;
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response.data as T;
}

/**
 * PUT request
 */
export async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  const response = await apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return response.data as T;
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<void> {
  await apiRequest<T>(endpoint, {
    method: 'DELETE',
  });
}

