import { RoleSelection } from "../components/RoleSelection";

interface RoleSelectionPageProps {
  onComplete: (position: string, department: string) => void;
  onLogout: () => void;
}

export function RoleSelectionPage({ onComplete, onLogout }: RoleSelectionPageProps) {
  return <RoleSelection onComplete={onComplete} onLogout={onLogout} />;
}