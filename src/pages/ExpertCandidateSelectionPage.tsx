import { ExpertCandidateSelection } from "../components/ExpertCandidateSelection";
import type { Candidate } from "../types";

interface ExpertCandidateSelectionPageProps {
  onComplete: (candidate: Candidate) => void;
  onLogout: () => void;
}

export function ExpertCandidateSelectionPage({ onComplete, onLogout }: ExpertCandidateSelectionPageProps) {
  return <ExpertCandidateSelection onComplete={onComplete} onLogout={onLogout} />;
}