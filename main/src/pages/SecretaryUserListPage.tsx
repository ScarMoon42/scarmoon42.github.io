import { SecretaryUserList } from "../components/SecretaryUserList";

interface SecretaryUserListPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryUserListPage({ onBack, onLogout }: SecretaryUserListPageProps) {
  return <SecretaryUserList onBack={onBack} onLogout={onLogout} />;
}