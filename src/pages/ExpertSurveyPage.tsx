import { ExpertSurvey } from "../components/ExpertSurvey";
import { Candidate } from "../types";

interface ExpertSurveyPageProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertSurveyPage({ candidate, onBack, onLogout }: ExpertSurveyPageProps) {
  return <ExpertSurvey candidate={candidate} onBack={onBack} onLogout={onLogout} />;
}