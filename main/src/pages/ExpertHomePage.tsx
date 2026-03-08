import { ExpertHome } from "../components/ExpertHome";
import { Candidate, Page } from "../types";

interface ExpertHomePageProps {
  candidate: Candidate | null;
  onNavigate: (page: Page) => void;
  onBackToCandidates: () => void;
  onLogout: () => void;
}

export function ExpertHomePage({ candidate, onNavigate, onBackToCandidates, onLogout }: ExpertHomePageProps) {
  return (
    <ExpertHome
      candidate={candidate}
      onNavigate={onNavigate}
      onBackToCandidates={onBackToCandidates}
      onLogout={onLogout}
    />
  );
}