/**
 * API пользователей (для секретаря) — список, создание, обновление, удаление
 */

import * as api from './api';

const API_PREFIX = import.meta.env.VITE_API_URL ? '' : '/api';

export interface ApiUser {
  id: string;
  login: string;
  name: string;
  role: string;
  department?: string;
  positions?: string;
  isTemporary?: boolean;
  expirationDate?: string;
}

export interface RankingTeacher {
  id: string;
  name: string;
  position: string;
  department: string;
  rating: number;
  details: {
    category: string;
    score: number;
    maxScore: number;
  }[];
}

export async function fetchUsers() {
  const res = await api.get<{ success?: boolean; data?: ApiUser[] }>(`${API_PREFIX}/users`);
  if (!res.success) return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
  const body = res.data as { data?: ApiUser[] } | undefined;
  const list = body?.data ?? (Array.isArray(res.data) ? res.data : []);
  return { success: true as const, data: list };
}

export async function createUser(body: {
  fullName: string;
  login: string;
  password: string;
  role: 'Преподаватель' | 'Эксперт' | 'Внешний эксперт' | 'Секретарь';
  positions?: string;
  department?: string;
  isTemporary?: boolean;
  expirationDate?: string;
}) {
  const res = await api.post<{ data?: ApiUser }>(`${API_PREFIX}/users`, body as Record<string, unknown>);
  if (!res.success) return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
  const data = (res.data as { data?: ApiUser })?.data ?? (res.data as ApiUser);
  return { success: true as const, data };
}

export async function updateUser(
  id: string,
  body: { fullName?: string; login?: string; role?: string; positions?: string; department?: string; isTemporary?: boolean; expirationDate?: string | null }
) {
  const res = await api.patch<{ data?: ApiUser }>(`${API_PREFIX}/users/${id}`, body as Record<string, unknown>);
  if (!res.success) return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
  const data = (res.data as { data?: ApiUser })?.data ?? (res.data as ApiUser);
  return { success: true as const, data };
}

export async function deleteUser(id: string) {
  const res = await api.del<void>(`${API_PREFIX}/users/${id}`);
  return res.success ? { success: true as const } : { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
}

export async function extendUserExpiration(id: string, expirationDate: string) {
  const res = await api.patch<{ data?: ApiUser }>(`${API_PREFIX}/users/${id}/extend-expiration`, { expirationDate });
  if (!res.success) return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
  const data = (res.data as { data?: ApiUser })?.data ?? (res.data as ApiUser);
  return { success: true as const, data };
}

export async function fetchRanking() {
  const res = await api.get<{ success?: boolean; data?: RankingTeacher[] }>(`${API_PREFIX}/users/ranking`);
  if (!res.success) return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка загрузки рейтинга' };
  const body = res.data as { data?: RankingTeacher[] } | undefined;
  const list = body?.data ?? (Array.isArray(res.data) ? res.data : []);
  return { success: true as const, data: list };
}
