/**
 * Сервис для работы с файлами
 */

import * as api from './api';

const FILES_PREFIX = import.meta.env.VITE_API_URL ? '' : '/api';

export interface UploadedFile {
  id: number;
  name: string;
  path: string;
  uploadedAt: string;
}

export interface FileItem {
  id: number;
  name: string;
  type: string; // УМК, ПК, и т.д.
  status: string;
  expertComment?: string;
  uploadedAt: string;
}

/**
 * Загрузить файлы
 */
export async function uploadFiles(fileType: 'umk' | 'pk' | string, files: File[]) {
  if (files.length === 0) {
    return { success: false as const, error: 'Выберите хотя бы один файл' };
  }

  try {
    // Конвертируем файлы в base64
    const filesData = await Promise.all(
      files.map((file) => {
        return new Promise<{ name: string; content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ name: file.name, content: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    const res = await api.post<{
      success?: boolean;
      data?: { count: number; files: UploadedFile[] };
      message?: string;
    }>(
      `${FILES_PREFIX}/files/upload`,
      {
        fileType,
        files: filesData,
      }
    );

    if (!res.success) {
      return {
        success: false as const,
        error: (res as { error?: string }).error ?? 'Ошибка загрузки',
      };
    }

    const payload = res.data as { data?: { count: number; files: UploadedFile[] } };
    const data = payload?.data ?? (res.data as { count: number; files: UploadedFile[] });

    if (!data) {
      return { success: false as const, error: 'Неверный ответ сервера' };
    }

    return { success: true as const, count: data.count, files: data.files };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return { success: false as const, error: errorMessage };
  }
}

/**
 * Получить список файлов текущего пользователя
 */
export async function getFiles() {
  const res = await api.get<{ success?: boolean; data?: FileItem[]; message?: string }>(
    `${FILES_PREFIX}/files`
  );

  if (!res.success) {
    return {
      success: false as const,
      error: (res as { error?: string }).error ?? 'Ошибка получения файлов',
    };
  }

  const payload = res.data as { data?: FileItem[] };
  const data = payload?.data ?? (Array.isArray(res.data) ? res.data : []);

  return { success: true as const, files: data };
}

/**
 * Получить список файлов пользователя (для эксперта — файлы кандидата)
 */
export async function getFilesByUserId(userId: string | number) {
  const uid = typeof userId === 'string' ? userId : String(userId);
  const res = await api.get<{ success?: boolean; data?: FileItem[]; message?: string }>(
    `${FILES_PREFIX}/files/by-user/${uid}`
  );
  if (!res.success) {
    return {
      success: false as const,
      error: (res as { error?: string }).error ?? 'Ошибка получения файлов',
    };
  }
  const payload = res.data as { data?: FileItem[] };
  const data = payload?.data ?? (Array.isArray(res.data) ? res.data : []);
  return { success: true as const, files: data };
}

/**
 * Скачать файл (с авторизацией)
 */
export async function downloadFile(fileId: number, fileName: string) {
  const base = import.meta.env.VITE_API_URL || '';
  const url = base ? `${base}/files/${fileId}/download` : `${window.location.origin}/api/files/${fileId}/download`;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(res.status === 403 ? 'Нет доступа' : 'Ошибка загрузки');
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName || 'file';
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Удалить файл
 */
export async function deleteFile(fileId: number) {
  const res = await api.del<{ success?: boolean; message?: string }>(
    `${FILES_PREFIX}/files/${fileId}`
  );

  if (!res.success) {
    return {
      success: false as const,
      error: (res as { error?: string }).error ?? 'Ошибка удаления',
    };
  }

  return { success: true as const };
}

/**
 * Оценить файл (для эксперта)
 */
export async function evaluateFile(fileId: number, status: string, expertComment?: string) {
  const res = await api.patch<{ success?: boolean; message?: string; data?: any }>(
    `${FILES_PREFIX}/files/${fileId}/evaluate`,
    { status, expertComment }
  );

  if (!res.success) {
    return {
      success: false as const,
      error: (res as any).message ?? 'Ошибка при сохранении оценки',
    };
  }

  return { success: true as const, data: res.data };
}

export default {
  uploadFiles,
  getFiles,
  getFilesByUserId,
  downloadFile,
  deleteFile,
};
