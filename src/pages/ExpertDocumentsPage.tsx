import { ExpertDocuments } from "../components/ExpertDocuments";
import { Candidate } from "../types";

interface ExpertDocumentsPageProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertDocumentsPage({ candidate, onBack, onLogout }: ExpertDocumentsPageProps) {
  return <ExpertDocuments candidate={candidate} onBack={onBack} onLogout={onLogout} />;
}