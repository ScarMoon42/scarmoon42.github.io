/**
 * API открытых занятий
 */

import * as api from './api';

const API_PREFIX = import.meta.env.VITE_API_URL ? '' : '/api';

export interface OpenClassItem {
  id: number;
  date: string;
  time: string;
  room: string;
  experts?: string[];
}

export interface OpenClassPublic {
  id: number;
  date: string;
  time: string;
  room: string;
  teacher: string;
}

/** Список открытых занятий преподавателя */
export async function fetchMyOpenClasses() {
  const res = await api.get<{ success?: boolean; data?: OpenClassItem[] }>(
    `${API_PREFIX}/open-classes`
  );
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка загрузки' };
  }
  const body = res.data as { data?: OpenClassItem[] } | undefined;
  const list = body?.data ?? (Array.isArray(res.data) ? res.data : []);
  return { success: true as const, data: list };
}

/** Информация об занятии по id (для QR, без авторизации) */
export async function fetchOpenClassById(id: number) {
  const res = await api.get<{ success?: boolean; data?: OpenClassPublic }>(
    `${API_PREFIX}/open-classes/${id}`
  );
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
  }
  const body = res.data as { data?: OpenClassPublic } | undefined;
  const data = body?.data ?? res.data;
  if (!data) return { success: false as const, error: 'Неверный ответ' };
  return { success: true as const, data };
}

/** Список всех открытых занятий (для секретаря) */
export async function fetchAllOpenClasses() {
  type AllItem = {
    id: number;
    date: string;
    time: string;
    room: string;
    teacher: { id: string; name: string };
    experts: Array<{ id: string; name: string }>;
  };

  const res = await api.get<{ success?: boolean; data?: AllItem[] }>(`${API_PREFIX}/open-classes/all`);
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка загрузки' };
  }
  const body = res.data as { data?: AllItem[] } | undefined;
  const list = body?.data ?? (Array.isArray(res.data) ? (res.data as AllItem[]) : []);
  return { success: true as const, data: list };
}

/** Создать открытое занятие (секретарь) */
export async function createOpenClass(data: {
  teacherId: number;
  date: string;
  time?: string;
  room?: string;
  expertIds: number[];
}) {
  const res = await api.post<{ success?: boolean; data?: { id: number } }>(
    `${API_PREFIX}/open-classes`,
    data as Record<string, unknown>
  );
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка' };
  }
  const payload = res.data as { data?: { id: number } } | undefined;
  const created = payload?.data ?? (res.data as { id?: number });
  const id = created?.id;
  if (id == null) return { success: false as const, error: 'Неверный ответ сервера' };
  return { success: true as const, id };
}

/** Удалить открытое занятие (секретарь) */
export async function deleteOpenClass(id: number) {
  const res = await api.del<{ success?: boolean; message?: string }>(`${API_PREFIX}/open-classes/${id}`);
  if (!res.success) {
    return {
      success: false as const,
      error: (res as { error?: string }).error ?? 'Ошибка удаления',
    };
  }
  return { success: true as const };
}

/** Отправить оценку студента */
export async function submitStudentResult(lessonId: number, result: Record<string, string>, ssid: string) {
  const res = await api.post<{ success?: boolean; message?: string }>(
    `${API_PREFIX}/open-classes/${lessonId}/student-result`,
    { result, ssid }
  );
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error || (res as any).message || 'Ошибка отправки' };
  }
  return { success: true as const };
}

/** Получить результаты оценки студентов (для преподавателя) */
export async function fetchStudentResults(lessonId: number) {
  const res = await api.get<{ success?: boolean; data?: any[] }>(
    `${API_PREFIX}/open-classes/${lessonId}/student-results`
  );
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error || 'Ошибка загрузки' };
  }
  const body = res.data as { data?: any[] } | undefined;
  return { success: true as const, data: body?.data || [] };
}
