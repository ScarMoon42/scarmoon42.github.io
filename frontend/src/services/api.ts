/**
 * API Service - Базовый сервис для взаимодействия с бэкендом
 * Поддерживает подключение к любому REST/GraphQL API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Базовый fetch с обработкой ошибок
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, params } = options;

  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // Добавляем параметры в URL
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Добавляем токен авторизации, если он есть
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      status: 0,
    };
  }
}

/**
 * GET запрос
 */
export async function get<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
) {
  return apiCall<T>(endpoint, { method: 'GET', params });
}

/**
 * POST запрос
 */
export async function post<T>(
  endpoint: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>
) {
  return apiCall<T>(endpoint, { method: 'POST', body, headers });
}

/**
 * PUT запрос
 */
export async function put<T>(
  endpoint: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>
) {
  return apiCall<T>(endpoint, { method: 'PUT', body, headers });
}

/**
 * DELETE запрос
 */
export async function del<T>(
  endpoint: string,
  body?: Record<string, unknown>
) {
  return apiCall<T>(endpoint, { method: 'DELETE', body });
}

/**
 * PATCH запрос
 */
export async function patch<T>(
  endpoint: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>
) {
  return apiCall<T>(endpoint, { method: 'PATCH', body, headers });
}

export default {
  get,
  post,
  put,
  del,
  patch,
  apiCall,
};
