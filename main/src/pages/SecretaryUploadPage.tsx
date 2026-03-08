import { SecretaryUpload } from "../components/SecretaryUpload";

interface SecretaryUploadPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryUploadPage({ onBack }: SecretaryUploadPageProps) {
  return <SecretaryUpload onBack={onBack} />;
}
