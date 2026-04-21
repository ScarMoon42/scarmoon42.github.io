import { ExpertOpenLesson } from "../components/ExpertOpenLesson";
import { Candidate } from "../types";

interface ExpertOpenLessonPageProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertOpenLessonPage({ candidate, onBack, onLogout }: ExpertOpenLessonPageProps) {
  return <ExpertOpenLesson candidate={candidate} onBack={onBack} onLogout={onLogout} />;
}