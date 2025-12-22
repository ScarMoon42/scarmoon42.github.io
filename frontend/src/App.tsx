import { useState } from "react";
import { Candidate, Page } from "./types";
import { LoginPage } from "./pages/LoginPage";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";
import { TeacherHomePage } from "./pages/TeacherHomePage";
import { UploadUMKPage } from "./pages/UploadUMKPage";
import { UploadPKPage } from "./pages/UploadPKPage";
import { TestingPage } from "./pages/TestingPage";
import { StudentChecklistPage } from "./pages/StudentChecklistPage";
import { ExpertCandidateSelectionPage } from "./pages/ExpertCandidateSelectionPage";
import { ExpertHomePage } from "./pages/ExpertHomePage";
import { ExpertDocumentsPage } from "./pages/ExpertDocumentsPage";
import { ExpertChecklistPage } from "./pages/ExpertChecklistPage";
import { ExpertSurveyPage } from "./pages/ExpertSurveyPage";
import { ExpertOpenLessonPage } from "./pages/ExpertOpenLessonPage";
import { SecretaryHomePage } from "./pages/SecretaryHomePage";
import { SecretaryUserListPage } from "./pages/SecretaryUserListPage";
import { SecretaryAssignLessonPage } from "./pages/SecretaryAssignLessonPage";
import { SecretaryRatingPage } from "./pages/SecretaryRatingPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const candidates: Candidate[] = [
    {
      id: "1",
      name: "Иванов Иван Иванович",
      position: "Доцент",
      department: "Высшей математики",
      applicationDate: "15.11.2025",
    },
    {
      id: "2",
      name: "Петрова Мария Сергеевна",
      position: "Старший преподаватель",
      department: "Информатики",
      applicationDate: "20.11.2025",
    },
    {
      id: "3",
      name: "Сидоров Иван Александрович",
      position: "Профессор",
      department: "Физики",
      applicationDate: "25.11.2025",
    },
  ];

  const handleLogin = (email: string, password: string) => {
    if (email === "teacher" && password === "1234") {
      setCurrentPage("role-selection");
    } else if (email === "expert" && password === "1234") {
      setCurrentPage("expert-candidate-selection");
    } else if (email === "secretary" && password === "1234") {
      setCurrentPage("secretary-home");
    }
  };

  const handleRoleComplete = () => {
    setCurrentPage("teacher-home");
  };

  const handleCandidateSelect = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setCurrentPage("expert-home");
    }
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setCurrentPage("login");
    setSelectedCandidate(null);
  };

  const pageComponents: Record<Page, JSX.Element> = {
    "login": <LoginPage onLogin={handleLogin} />,
    "role-selection": <RoleSelectionPage onComplete={handleRoleComplete} onLogout={handleLogout} />,
    "teacher-home": <TeacherHomePage onNavigate={handleNavigate} onLogout={handleLogout} />,
    "upload-umk": <UploadUMKPage onBack={() => handleNavigate("teacher-home")} onLogout={handleLogout} />,
    "upload-pk": <UploadPKPage onBack={() => handleNavigate("teacher-home")} onLogout={handleLogout} />,
    "testing": <TestingPage onBack={() => handleNavigate("teacher-home")} onLogout={handleLogout} />,
    "student-checklist": <StudentChecklistPage />,
    "expert-candidate-selection": <ExpertCandidateSelectionPage onComplete={handleCandidateSelect} onLogout={handleLogout} />,
    "expert-home": <ExpertHomePage candidate={selectedCandidate} onNavigate={handleNavigate} onBackToCandidates={() => handleNavigate("expert-candidate-selection")} onLogout={handleLogout} />,
    "expert-documents": <ExpertDocumentsPage candidate={selectedCandidate} onBack={() => handleNavigate("expert-home")} onLogout={handleLogout} />,
    "expert-checklist": <ExpertChecklistPage candidate={selectedCandidate} onBack={() => handleNavigate("expert-home")} onLogout={handleLogout} />,
    "expert-survey": <ExpertSurveyPage candidate={selectedCandidate} onBack={() => handleNavigate("expert-home")} onLogout={handleLogout} />,
    "expert-open-lesson": <ExpertOpenLessonPage candidate={selectedCandidate} onBack={() => handleNavigate("expert-home")} onLogout={handleLogout} />,
    "secretary-home": <SecretaryHomePage onNavigate={handleNavigate} onLogout={handleLogout} />,
    "secretary-users": <SecretaryUserListPage onBack={() => handleNavigate("secretary-home")} onLogout={handleLogout} />,
    "secretary-assign": <SecretaryAssignLessonPage onBack={() => handleNavigate("secretary-home")} onLogout={handleLogout} />,
    "secretary-rating": <SecretaryRatingPage onBack={() => handleNavigate("secretary-home")} onLogout={handleLogout} />,
  };

  return pageComponents[currentPage];
}