import { Card, CardContent } from "./ui/card";
import { UserCircle } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { getStoredUser } from "../services/auth";

interface SecretaryHomeProps {
  onNavigate: (page: "secretary-users" | "secretary-assign" | "secretary-rating" | "secretary-upload" | "secretary-metadata" | "secretary-assignment") => void;
  onLogout: () => void;
}

export function SecretaryHome({ onNavigate, onLogout }: SecretaryHomeProps) {
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-600">Роль</p>
              <div className="flex items-center gap-2">
                <p className="text-xl">{user?.role ?? "Секретарь"}</p>
                <UserCircle className="h-8 w-8" />
              </div>
            </div>
          </div>
          {user && (
            <Card className="border border-gray-200 bg-gray-50/50">
              <CardContent className="py-3 px-4">
                <p className="text-sm text-gray-600">Профиль</p>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-sm text-gray-500">{user.login}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8 mt-12">
          {/* Список пользователей */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("secretary-users")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  className="text-purple-500"
                >
                  <defs>
                    <linearGradient id="gradientUsers" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="45" r="15" fill="url(#gradientUsers)" />
                  <ellipse cx="60" cy="80" rx="25" ry="18" fill="url(#gradientUsers)" />
                  <circle cx="35" cy="50" r="12" fill="url(#gradientUsers)" opacity="0.7" />
                  <ellipse cx="35" cy="78" rx="18" ry="14" fill="url(#gradientUsers)" opacity="0.7" />
                  <circle cx="85" cy="50" r="12" fill="url(#gradientUsers)" opacity="0.7" />
                  <ellipse cx="85" cy="78" rx="18" ry="14" fill="url(#gradientUsers)" opacity="0.7" />
                </svg>
              </div>
              <p className="text-center text-lg">
                Список
              </p>
            </CardContent>
          </Card>

          {/* Загрузка тестов/форм */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("secretary-upload")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg width="120" height="120" viewBox="0 0 120 120" className="text-blue-500">
                  <defs>
                    <linearGradient id="gradientUpload" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <rect x="30" y="30" width="60" height="40" rx="4" stroke="url(#gradientUpload)" strokeWidth="4" fill="none" />
                  <path d="M60 30 L60 14" stroke="url(#gradientUpload)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M52 22 L60 14 L68 22" stroke="url(#gradientUpload)" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <p className="text-center text-lg">Загрузить тест/форму</p>
            </CardContent>
          </Card>

          {/* Закрепление за ППС */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("secretary-assign")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  className="text-purple-500"
                >
                  <defs>
                    <linearGradient id="gradientPaper" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="35"
                    y="25"
                    width="50"
                    height="70"
                    rx="5"
                    fill="none"
                    stroke="url(#gradientPaper)"
                    strokeWidth="4"
                    transform="rotate(-15 60 60)"
                  />
                  <line
                    x1="40"
                    y1="45"
                    x2="65"
                    y2="45"
                    stroke="url(#gradientPaper)"
                    strokeWidth="3"
                    transform="rotate(-15 60 60)"
                  />
                  <line
                    x1="40"
                    y1="55"
                    x2="70"
                    y2="55"
                    stroke="url(#gradientPaper)"
                    strokeWidth="3"
                    transform="rotate(-15 60 60)"
                  />
                  <line
                    x1="40"
                    y1="65"
                    x2="60"
                    y2="65"
                    stroke="url(#gradientPaper)"
                    strokeWidth="3"
                    transform="rotate(-15 60 60)"
                  />
                </svg>
              </div>
              <p className="text-center text-lg">
                Закрепление за ППС
              </p>
            </CardContent>
          </Card>

          {/* Рейтинг ППС */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("secretary-rating")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  className="text-purple-500"
                >
                  <defs>
                    <linearGradient id="gradientAward" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="55"
                    r="25"
                    fill="none"
                    stroke="url(#gradientAward)"
                    strokeWidth="4"
                  />
                  <path
                    d="M60 35 L65 45 L76 46 L68 54 L70 65 L60 59 L50 65 L52 54 L44 46 L55 45 Z"
                    fill="url(#gradientAward)"
                  />
                </svg>
              </div>
              <p className="text-center text-lg">
                Рейтинг ППС
              </p>
            </CardContent>
          </Card>

          {/* Управление справочниками */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("secretary-metadata")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg width="120" height="120" viewBox="0 0 120 120" className="text-orange-500">
                  <defs>
                    <linearGradient id="gradientMeta" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                  <rect x="30" y="30" width="60" height="60" rx="4" stroke="url(#gradientMeta)" strokeWidth="4" fill="none" />
                  <line x1="40" y1="45" x2="80" y2="45" stroke="url(#gradientMeta)" strokeWidth="4" strokeLinecap="round" />
                  <line x1="40" y1="60" x2="80" y2="60" stroke="url(#gradientMeta)" strokeWidth="4" strokeLinecap="round" />
                  <line x1="40" y1="75" x2="60" y2="75" stroke="url(#gradientMeta)" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-center text-lg">Управление справочниками</p>
            </CardContent>
          </Card>

          {/* Назначение экспертов */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("secretary-assignment")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-green-500">
                  <defs>
                    <linearGradient id="gradientLink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  {/* Левый скобка */}
                  <path d="M45 85H35C21.19 85 10 73.81 10 60C10 46.19 21.19 35 35 35H45" 
                    stroke="url(#gradientLink)" strokeWidth="10" strokeLinecap="round" />
                  {/* Правая скобка */}
                  <path d="M75 35H85C98.81 35 110 46.19 110 60C110 73.81 98.81 85 85 85H75" 
                    stroke="url(#gradientLink)" strokeWidth="10" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-center text-lg">Закрепление экспертов</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
