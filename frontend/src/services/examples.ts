/**
 * Примеры использования API для разных ролей в приложении
 * Замените endpoints на реальные адреса вашего бэкенда
 */

import * as api from './api';
import { useFetchData, useMutation } from './useAPI';

// ============ ТИПЫ ============

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'expert' | 'secretary';
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  teacher: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

// ============ AUTH API ============

export const loginUser = (email: string, password: string) => {
  return api.post<{ token: string; user: User }>('/auth/login', {
    email,
    password,
  });
};

export const logoutUser = () => {
  return api.post('/auth/logout', {});
};

export const getCurrentUser = () => {
  return api.get<User>('/auth/me');
};

// ============ STUDENT API ============

export const getStudentChecklist = (studentId: string) => {
  return api.get(`/students/${studentId}/checklist`);
};

export const updateStudentChecklist = (
  studentId: string,
  checklistData: Record<string, unknown>
) => {
  return api.put(
    `/students/${studentId}/checklist`,
    checklistData
  );
};

// ============ TEACHER API ============

export const getTeacherLessons = (teacherId: string) => {
  return api.get<Lesson[]>(`/teachers/${teacherId}/lessons`);
};

export const createLesson = (lessonData: Partial<Lesson>) => {
  return api.post<Lesson>('/lessons', lessonData);
};

export const updateLesson = (lessonId: string, lessonData: Partial<Lesson>) => {
  return api.put<Lesson>(`/lessons/${lessonId}`, lessonData);
};

export const deleteLesson = (lessonId: string) => {
  return api.del(`/lessons/${lessonId}`);
};

// ============ EXPERT API ============

export const getExpertCandidates = (expertId: string) => {
  return api.get(`/experts/${expertId}/candidates`);
};

export const submitExpertReview = (
  expertId: string,
  candidateId: string,
  review: Record<string, unknown>
) => {
  return api.post(
    `/experts/${expertId}/reviews`,
    { candidateId, ...review }
  );
};

export const getExpertSurveys = (expertId: string) => {
  return api.get(`/experts/${expertId}/surveys`);
};

// ============ SECRETARY API ============

export const getSecretaryUsers = (departmentId: string) => {
  return api.get<User[]>(`/secretary/departments/${departmentId}/users`);
};

export const assignLesson = (
  studentId: string,
  lessonId: string
) => {
  return api.post('/secretary/assignments', {
    studentId,
    lessonId,
  });
};

export const getRatingData = (departmentId: string) => {
  return api.get(`/secretary/departments/${departmentId}/ratings`);
};

// ============ DOCUMENT API ============

export const uploadDocument = (
  file: File,
  type: 'PK' | 'UMK',
  userId: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  formData.append('userId', userId);

  return fetch(`${import.meta.env.VITE_API_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: formData,
  }).then((res) => res.json());
};

export const getDocuments = (userId: string) => {
  return api.get<Document[]>(`/documents/user/${userId}`);
};

// ============ HOOKS ============

/**
 * Hook для получения текущего пользователя
 */
export function useCurrentUser() {
  return useFetchData<User>('/auth/me');
}

/**
 * Hook для получения уроков учителя
 */
export function useTeacherLessons(teacherId: string) {
  return useFetchData<Lesson[]>(`/teachers/${teacherId}/lessons`);
}

/**
 * Hook для обновления урока
 */
export function useUpdateLesson(lessonId: string) {
  return useMutation((data: Partial<Lesson>) =>
    api.put<Lesson>(`/lessons/${lessonId}`, data)
  );
}

/**
 * Hook для загрузки документа
 */
export function useUploadDocument() {
  return useMutation((data: { file: File; type: 'PK' | 'UMK'; userId: string }) =>
    uploadDocument(data.file, data.type, data.userId)
  );
}

/**
 * Hook для входа в систему
 */
export function useLogin() {
  return useMutation((data: { email: string; password: string }) =>
    loginUser(data.email, data.password)
  );
}

export default {
  // Auth
  loginUser,
  logoutUser,
  getCurrentUser,
  useCurrentUser,

  // Student
  getStudentChecklist,
  updateStudentChecklist,

  // Teacher
  getTeacherLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  useTeacherLessons,
  useUpdateLesson,

  // Expert
  getExpertCandidates,
  submitExpertReview,
  getExpertSurveys,

  // Secretary
  getSecretaryUsers,
  assignLesson,
  getRatingData,

  // Documents
  uploadDocument,
  getDocuments,
  useUploadDocument,

  // Login
  useLogin,
};
