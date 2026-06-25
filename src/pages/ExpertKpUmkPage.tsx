import { ExpertKpUmk } from "../components/ExpertKpUmk";
import { Candidate } from "../types";

interface ExpertKpUmkPageProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertKpUmkPage({ candidate, onBack, onLogout }: ExpertKpUmkPageProps) {
  return <ExpertKpUmk candidate={candidate} onBack={onBack} onLogout={onLogout} />;
}
