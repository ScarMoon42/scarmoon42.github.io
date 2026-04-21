import { UploadPK } from "../components/UploadPK";

interface UploadPKPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function UploadPKPage({ onBack, onLogout }: UploadPKPageProps) {
  return <UploadPK onBack={onBack} onLogout={onLogout} />;
}