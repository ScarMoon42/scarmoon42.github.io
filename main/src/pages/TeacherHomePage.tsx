import { TeacherHome } from "../components/TeacherHome";

interface TeacherHomePageProps {
  onNavigate: (page: "upload-umk" | "upload-pk" | "testing" | "student-checklist") => void;
  onNavigateToChecklist?: (lessonId: number) => void;
  onLogout: () => void;
}

export function TeacherHomePage({ onNavigate, onNavigateToChecklist, onLogout }: TeacherHomePageProps) {
  return <TeacherHome onNavigate={onNavigate} onNavigateToChecklist={onNavigateToChecklist} onLogout={onLogout} />;
}
