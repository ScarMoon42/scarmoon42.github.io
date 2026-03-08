export interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  applicationDate: string;
}

export interface User {
  id: string;
  name: string;
  login: string;
  role: "Преподаватель" | "Эксперт" | "Внешний эксперт";
  isTemporary: boolean;
  expirationDate?: string;
}

export interface Teacher {
  id: string;
  name: string;
}

export interface Expert {
  id: string;
  name: string;
}

export interface Lesson {
  id: string;
  teacher: string;
  date: string;
  time: string;
  room: string;
  experts: string[];
  qrCode: string;
}

export type Page =
  | "login"
  | "role-selection"
  | "teacher-home"
  | "upload-umk"
  | "upload-pk"
  | "testing"
  | "student-checklist"
  | "expert-candidate-selection"
  | "expert-home"
  | "expert-documents"
  | "expert-checklist"
  | "expert-survey"
  | "expert-open-lesson"
  | "secretary-home"
  | "secretary-users"
  | "secretary-assign"
  | "secretary-rating"
  | "secretary-upload"
  | "secretary-metadata"
  | "secretary-assignment";
