import { getIdToken } from '@/lib/firebase/visionaries-tech';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Cliente API base para hacer peticiones autenticadas
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getIdToken();
    
    if (!token) {
      throw new Error('No authentication token available');
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
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[API Client] Error in ${endpoint}:`, error);
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

