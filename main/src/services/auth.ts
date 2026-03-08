/**
 * Сессия (Keycloak JWT) + профиль пользователя из API
 */

import * as api from './api';

const AUTH_PREFIX = import.meta.env.VITE_API_URL || '/api';

export interface AuthUser {
  id: number;
  login: string;
  fullName: string;
  role: string;
  department: string | null;
  positions: string | null;
  expirationDate: string | null;
}

export function setAccessToken(token: string | null) {
  if (!token) localStorage.removeItem('authToken');
  else localStorage.setItem('authToken', token);
}

export function clearSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

export async function getCurrentUser(): Promise<ApiResponse<AuthUser>> {
  const res = await api.get<{ success?: boolean; data?: AuthUser }>(`${AUTH_PREFIX}/auth/me`);
  if (!res.success) {
    return { success: false, error: (res as { error?: string }).error, status: res.status };
  }
  const payload = res.data as { data?: AuthUser };
  const user = payload?.data ?? res.data;
  if (user) localStorage.setItem('authUser', JSON.stringify(user));
  return { success: true, data: user as AuthUser, status: res.status };
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('authUser', JSON.stringify(user));
}

export function getStoredToken(): string | null {
  return localStorage.getItem('authToken');
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('authUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function updateProfile(positions: string, department: string) {
  const res = await api.patch<{ success?: boolean; data?: AuthUser }>(
    `${AUTH_PREFIX}/auth/profile`,
    { positions, department }
  );
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка обновления профиля' };
  }
  const data = (res.data as { data?: AuthUser })?.data ?? (res.data as AuthUser);
  if (!data) {
    return { success: false as const, error: 'Неверный ответ сервера' };
  }
  // Обновляем сохраненные данные пользователя
  const token = getStoredToken();
  if (token) {
    saveSession(token, data);
  }
  return { success: true as const, user: data };
}

type ApiResponse<T> = { success: true; data: T; status: number } | { success: false; error?: string; status: number };
