import { SecretaryRating } from "../components/SecretaryRating";

interface SecretaryRatingPageProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryRatingPage({ onBack, onLogout }: SecretaryRatingPageProps) {
  return <SecretaryRating onBack={onBack} onLogout={onLogout} />;
}