import { useState, useEffect, useRef } from "react";
import { Candidate, Page } from "./types";
import { getPageFromHash, pushHistoryForPage, replaceHistoryForPage, isValidPage, getLessonIdFromHash } from "./lib/routing";
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
import { SecretaryUploadPage } from "./pages/SecretaryUploadPage";
import { SecretaryMetadataPage } from "./pages/SecretaryMetadataPage";
import { SecretaryExpertAssignmentPage } from "./pages/SecretaryExpertAssignmentPage";
import { initKeycloak, login as keycloakLogin, logout as keycloakLogout, ensureFreshToken } from "./auth/keycloak";
import { clearSession, getCurrentUser, setAccessToken, type AuthUser } from "./services/auth";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromHash());
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [checklistLessonId, setChecklistLessonId] = useState<number | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const routeByRole = (user: AuthUser) => {
    const role = user.role;
    if (role === "Секретарь") setCurrentPage("secretary-home");
    else if (role === "Эксперт" || role === "Внешний эксперт") setCurrentPage("expert-candidate-selection");
    else if (role === "Преподаватель") setCurrentPage(user.positions && user.department ? "teacher-home" : "role-selection");
    else setCurrentPage("login");
  };

  useEffect(() => {
    let refreshTimer: number | undefined;
    (async () => {
      try {
        console.log('Initializing Keycloak...');
        const authenticated = await initKeycloak();
        console.log('Keycloak initialized, authenticated:', authenticated);
        if (!authenticated) {
          setAccessToken(null);
          setAuthReady(true);
          if (currentPage !== "login" && currentPage !== "student-checklist") {
            setCurrentPage("login");
          }
          return;
        }
        const token = await ensureFreshToken();
        if (!token) {
          // Токен не удалось получить — выходим
          setAccessToken(null);
          setAuthReady(true);
          if (currentPage !== "student-checklist") {
            setCurrentPage("login");
          }
          return;
        }
        setAccessToken(token);
        refreshTimer = window.setInterval(async () => {
          const t = await ensureFreshToken();
          if (t) setAccessToken(t);
        }, 60_000);
        const me = await getCurrentUser();
        console.log('Current user:', me);
        if (me.success) {
          routeByRole(me.data);
        } else {
          console.error('Не удалось получить профиль пользователя:', me.error);
          setCurrentPage("login");
          if (me.status === 403) {
            alert('Ошибка доступа: ' + (me.error || 'Ваш аккаунт деактивирован.'));
            handleLogout();
            return;
          }
        }
        setAuthReady(true);

      } catch (error) {
        console.error('Auth error:', error);
        setAccessToken(null);
        setAuthReady(true);
      }
    })();
    return () => {
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обработка кнопки «Назад» в браузере — должно быть до эффекта синхронизации
  const skipNextHistoryPush = useRef(false);
  useEffect(() => {
    if (!authReady) return;
    const handlePopState = async (e: PopStateEvent) => {
      skipNextHistoryPush.current = true;
      const state = e.state as { page?: unknown; candidate?: Candidate; lessonId?: number } | null;
      let targetPage: Page;
      let targetCandidate: Candidate | null = null;
      let targetLessonId: number | null = null;

      if (state?.page && isValidPage(state.page)) {
        targetPage = state.page;
        targetCandidate = state.candidate ?? null;
        targetLessonId = state.lessonId ?? null;
      } else {
        targetPage = getPageFromHash();
        targetLessonId = targetPage === "student-checklist" ? getLessonIdFromHash() : null;
        if (["expert-home", "expert-documents", "expert-checklist", "expert-survey", "expert-open-lesson"].includes(targetPage)) {
          // Can't reliably recover candidate from just a hash currently unless stored elsewhere.
        }
      }

      const me = await getCurrentUser();
      const role = me?.success ? me.data.role : null;

      if (validateRouteAccess(targetPage, role)) {
        setCurrentPage(targetPage);
        setSelectedCandidate(targetCandidate);
        setChecklistLessonId(targetLessonId);
      } else {
        if (me?.success) {
          routeByRole(me.data);
        } else {
          setCurrentPage("login");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [authReady]);

  // Синхронизация текущей страницы с URL при изменении
  const isInitialMount = useRef(true);
  const lessonIdForHistory = currentPage === "student-checklist" ? (checklistLessonId ?? getLessonIdFromHash()) : undefined;
  useEffect(() => {
    if (!authReady) return;
    if (skipNextHistoryPush.current) {
      skipNextHistoryPush.current = false;
      replaceHistoryForPage(currentPage, selectedCandidate ?? undefined, lessonIdForHistory ?? undefined);
      return;
    }
    if (isInitialMount.current) {
      isInitialMount.current = false;
      replaceHistoryForPage(currentPage, selectedCandidate ?? undefined, lessonIdForHistory ?? undefined);
    } else {
      pushHistoryForPage(currentPage, selectedCandidate ?? undefined, lessonIdForHistory ?? undefined);
    }
  }, [currentPage, selectedCandidate, lessonIdForHistory]);

  const handleLogin = async (): Promise<void> => {
    await keycloakLogin();
  };

  const handleRoleComplete = async (position: string, department: string) => {
    // Сохраняем должность и направление на сервере
    const result = await import("./services/auth").then((m) => m.updateProfile(position, department));
    if (!result.success) {
      console.error("Ошибка при обновлении профиля:", result.error);
      // Все равно переходим на главную страницу преподавателя
    }
    setCurrentPage("teacher-home");
  };

  const validateRouteAccess = (page: Page, userRole?: string | null): boolean => {
    // Страница чек-листа доступна всем (анонимно по QR-коду)
    if (page === "student-checklist") return true;

    if (!userRole) return page === "login" || page === "role-selection";

    const isSecretaryPage = page.startsWith("secretary-");
    const isExpertPage = page.startsWith("expert-");
    const isTeacherPage = ["teacher-home", "upload-umk", "upload-pk", "testing"].includes(page);

    if (userRole === "Секретарь") return isSecretaryPage;
    if (userRole === "Эксперт" || userRole === "Внешний эксперт") return isExpertPage;
    if (userRole === "Преподаватель") return isTeacherPage || page === "role-selection";

    return false;
  };

  const attemptNavigation = async (page: Page, candidate?: Candidate, lessonId?: number) => {
    const me = await getCurrentUser();
    const role = me?.success ? me.data.role : null;

    if (validateRouteAccess(page, role)) {
      setCurrentPage(page);
      if (candidate !== undefined) setSelectedCandidate(candidate);
      if (lessonId !== undefined) setChecklistLessonId(lessonId);
    } else {
      if (me?.success) {
        routeByRole(me.data);
      } else {
        setCurrentPage("login");
      }
    }
  };

  const handleNavigate = (page: Page) => {
    attemptNavigation(page);
  };

  const handleNavigateToChecklist = (lessonId: number) => {
    attemptNavigation("student-checklist", undefined, lessonId);
  };

  const handleCandidateSelect = (candidate: Candidate) => {
    attemptNavigation("expert-home", candidate);
  };

  const handleLogout = () => {
    clearSession();
    keycloakLogout();
    setCurrentPage("login");
    setSelectedCandidate(null);
    setChecklistLessonId(null);
  };

  const pageComponents: Record<Page, JSX.Element> = {
    "login": <LoginPage onLogin={handleLogin} />,
    "role-selection": <RoleSelectionPage onComplete={handleRoleComplete} onLogout={handleLogout} />,
    "teacher-home": <TeacherHomePage onNavigate={handleNavigate} onNavigateToChecklist={handleNavigateToChecklist} onLogout={handleLogout} />,
    "upload-umk": <UploadUMKPage onBack={() => handleNavigate("teacher-home")} onLogout={handleLogout} />,
    "upload-pk": <UploadPKPage onBack={() => handleNavigate("teacher-home")} onLogout={handleLogout} />,
    "testing": <TestingPage onBack={() => handleNavigate("teacher-home")} onLogout={handleLogout} />,
    "student-checklist": <StudentChecklistPage lessonId={String(checklistLessonId ?? getLessonIdFromHash() ?? "") || undefined} />,
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
    "secretary-upload": <SecretaryUploadPage onBack={() => handleNavigate("secretary-home")} onLogout={handleLogout} />,
    "secretary-metadata": <SecretaryMetadataPage onBack={() => handleNavigate("secretary-home")} onLogout={handleLogout} />,
    "secretary-assignment": <SecretaryExpertAssignmentPage onBack={() => handleNavigate("secretary-home")} onLogout={handleLogout} />,
  };

  if (!authReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>Загрузка</div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>
            Подключение к системе аутентификации...
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '30px' }}>
            Если это займет более 15 секунд, проверьте соединение
          </div>
        </div>
      </div>
    );
  }
  const page = isValidPage(currentPage) ? currentPage : "login";
  return pageComponents[page] ?? pageComponents["login"];
}