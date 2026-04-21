import { UploadUMK } from "../components/UploadUMK";

interface UploadUMKPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function UploadUMKPage({ onBack, onLogout }: UploadUMKPageProps) {
  return <UploadUMK onBack={onBack} onLogout={onLogout} />;
}