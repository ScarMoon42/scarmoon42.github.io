import { SecretaryMetadata } from "../components/SecretaryMetadata";

interface SecretaryMetadataPageProps {
    onBack: () => void;
    onLogout: () => void;
}

export function SecretaryMetadataPage({ onBack, onLogout }: SecretaryMetadataPageProps) {
    return <SecretaryMetadata onBack={onBack} onLogout={onLogout} />;
}
