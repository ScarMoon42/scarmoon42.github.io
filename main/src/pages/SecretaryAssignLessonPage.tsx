import { SecretaryAssignLesson } from "../components/SecretaryAssignLesson";

interface SecretaryAssignLessonPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryAssignLessonPage({ onBack, onLogout }: SecretaryAssignLessonPageProps) {
  return <SecretaryAssignLesson onBack={onBack} onLogout={onLogout} />;
}