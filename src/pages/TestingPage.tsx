import { Testing } from "../components/Testing";

interface TestingPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function TestingPage({ onBack, onLogout }: TestingPageProps) {
  return <Testing onBack={onBack} onLogout={onLogout} />;
}