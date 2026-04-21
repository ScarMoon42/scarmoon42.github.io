import { SecretaryExpertAssignment } from "../components/SecretaryExpertAssignment";

interface SecretaryExpertAssignmentPageProps {
    onBack: () => void;
    onLogout: () => void;
}

export function SecretaryExpertAssignmentPage({ onBack, onLogout }: SecretaryExpertAssignmentPageProps) {
    return <SecretaryExpertAssignment onBack={onBack} onLogout={onLogout} />;
}
