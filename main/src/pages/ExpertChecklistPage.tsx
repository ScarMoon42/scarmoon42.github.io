import { ExpertChecklist } from "../components/ExpertChecklist";
import { Candidate } from "../types";

interface ExpertChecklistPageProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertChecklistPage({ candidate, onBack, onLogout }: ExpertChecklistPageProps) {
  return <ExpertChecklist candidate={candidate} onBack={onBack} onLogout={onLogout} />;
}