import * as api from './api';

const API_PREFIX = import.meta.env.VITE_API_URL ? '' : '/api';

export interface FileEvaluation {
    id: number;
    teacherId: number;
    idExpert: number;
    formId: number;
    result: any;
    createdAt: string;
    files: Array<{
        file: {
            id: number;
            name: string;
            path: string;
        }
    }>;
}

/** Сохранить оценку файлов экспертом */
export async function saveFileEvaluation(teacherId: number, result: any, fileIds: number[]) {
    const res = await api.post<{ success: boolean; data?: any; message?: string }>(
        `${API_PREFIX}/files/result`,
        { teacherId, result, fileIds }
    );
    if (!res.success) {
        return { success: false as const, error: (res as any).message || 'Ошибка сохранения' };
    }
    return { success: true as const, data: res.data };
}

/** Получить оценку файлов конкретного преподавателя */
export async function getFileEvaluation(teacherId: number) {
    const res = await api.get<{ success: boolean; data?: FileEvaluation; message?: string }>(
        `${API_PREFIX}/files/result/${teacherId}`
    );
    if (!res.success) {
        return { success: false as const, error: (res as any).message || 'Ошибка загрузки' };
    }
    return { success: true as const, data: res.data };
}
