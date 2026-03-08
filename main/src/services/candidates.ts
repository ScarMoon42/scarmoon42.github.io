/**
 * API кандидатов (претенденты ППС) для эксперта
 */

import * as api from './api';

const API_PREFIX = import.meta.env.VITE_API_URL ? '' : '/api';

export interface CandidateItem {
  id: string;
  name: string;
  position: string;
  department: string;
  applicationDate: string;
}

export async function fetchCandidates() {
  const res = await api.get<{ success?: boolean; data?: CandidateItem[] }>(`${API_PREFIX}/candidates`);
  if (!res.success) {
    return { success: false as const, error: (res as { error?: string }).error ?? 'Ошибка загрузки' };
  }
  const body = res.data as { data?: CandidateItem[] } | undefined;
  const list = body?.data ?? (Array.isArray(res.data) ? res.data : []);
  return { success: true as const, data: list };
}
