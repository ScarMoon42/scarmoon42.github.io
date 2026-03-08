/**
 * API Service - Базовый сервис для взаимодействия с бэкендом
 * Поддерживает подключение к любому REST/GraphQL API
 */

import { getAccessToken } from '../auth/keycloak';

// Пусто = запросы на тот же origin (прокси Vite /api -> бэкенд); иначе полный URL бэкенда
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

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
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Получаем токен из Keycloak (безопаснее чем localStorage)
    const token = getAccessToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
    const urlFinal = endpoint.startsWith('http') ? new URL(endpoint) : new URL(endpoint, baseUrl + (baseUrl.endsWith('/') ? '' : '/'));
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        urlFinal.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(urlFinal.toString(), {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return {
        success: false,
        error: response.ok ? 'Неверный ответ сервера' : `HTTP ${response.status}`,
        status: response.status,
      };
    }

    if (!response.ok) {
      const errMsg = (data && typeof data === 'object' && 'message' in data && (data as { message: unknown }).message);
      return {
        success: false,
        error: (errMsg != null && errMsg !== '' ? String(errMsg) : `HTTP ${response.status}`),
        status: response.status,
      };
    }

    return {
      success: true,
      data: data as T,
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
