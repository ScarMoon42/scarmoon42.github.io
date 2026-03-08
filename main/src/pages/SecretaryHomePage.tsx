import { SecretaryHome } from "../components/SecretaryHome";

interface SecretaryHomePageProps {
  onNavigate: (page: "secretary-users" | "secretary-assign" | "secretary-rating" | "secretary-upload" | "secretary-metadata" | "secretary-assignment") => void;
  onLogout: () => void;
}

export function SecretaryHomePage({ onNavigate, onLogout }: SecretaryHomePageProps) {
  return <SecretaryHome onNavigate={onNavigate} onLogout={onLogout} />;
}
