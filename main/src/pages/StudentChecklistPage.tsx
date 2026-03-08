import { StudentChecklist } from "../components/StudentChecklist";

interface StudentChecklistPageProps {
  lessonId?: string;
}

export function StudentChecklistPage({ lessonId }: StudentChecklistPageProps) {
  return <StudentChecklist lessonId={lessonId} />;
}
