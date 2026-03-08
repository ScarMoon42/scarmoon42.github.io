import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { UserCircle, Users } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  applicationDate: string;
}

interface ExpertHomeProps {
  candidate: Candidate | null;
  onNavigate: (page: "expert-documents" | "expert-checklist" | "expert-survey" | "expert-open-lesson") => void;
  onBackToCandidates: () => void;
  onLogout: () => void;
}

export function ExpertHome({ candidate, onNavigate, onBackToCandidates, onLogout }: ExpertHomeProps) {
  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-600">Роль</p>
              <div className="flex items-center gap-2">
                <p className="text-xl">Эксперт</p>
                <UserCircle className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl mb-2">Информация о проведении открытого занятия:</h2>
            <p className="text-gray-700">_______________(дата)</p>
            <p className="text-gray-700">______________(время)</p>
            <p className="text-gray-700">__________(аудитория)</p>
          </div>
        </div>

        {candidate && (
          <div className="mb-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <h3 className="text-sm text-gray-600 mb-2">Оценка кандидата:</h3>
            <p className="text-xl mb-3">{candidate.name}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Должность</p>
                <p>{candidate.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Кафедра</p>
                <p>{candidate.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Дата подачи</p>
                <p>{candidate.applicationDate}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <Button variant="outline" onClick={onBackToCandidates} className="gap-2">
            <Users className="h-4 w-4" />
            Выбрать другого кандидата
          </Button>
        </div>

        <div className="mb-8">
          <p className="text-lg mb-4">
            Приветствуем Вас, Уважаемый эксперт!
          </p>
          <p className="text-lg mb-4">
            Просим Вас ознакомиться с учебно-методическим комплексом (УМК) и курсовыми проектами (КП),
          </p>
          <p className="text-lg mb-4">
            предоставленными претендентом на должность профессорско преподавательского состава (ППС).
          </p>
          <p className="text-lg mb-4">
            После изучения документов, просим Вас их оценить прямо в разделе "УМК, КП" (статус и комментарий), а также заполнить "Анкету работодателя".
          </p>
          <p className="text-lg mb-6">
            Во время открытого занятия необходимо будет заполнить чек-лист по открытому занятию.
          </p>
          <p className="text-lg">
            Благодарим за участие!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-12">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("expert-documents")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  className="text-purple-500"
                >
                  <defs>
                    <linearGradient id="gradientDoc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="20"
                    y="25"
                    width="60"
                    height="50"
                    rx="5"
                    fill="none"
                    stroke="url(#gradientDoc)"
                    strokeWidth="3"
                  />
                  <line
                    x1="30"
                    y1="40"
                    x2="60"
                    y2="40"
                    stroke="url(#gradientDoc)"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="50"
                    x2="60"
                    y2="50"
                    stroke="url(#gradientDoc)"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="60"
                    x2="50"
                    y2="60"
                    stroke="url(#gradientDoc)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p className="text-center">
                УМК, КП
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("expert-survey")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  className="text-purple-500"
                >
                  <defs>
                    <linearGradient id="gradientCheck2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M30 20 L70 20 L75 25 L75 75 L30 75 Z"
                    fill="none"
                    stroke="url(#gradientCheck2)"
                    strokeWidth="3"
                  />
                  <line
                    x1="70"
                    y1="20"
                    x2="75"
                    y2="25"
                    stroke="url(#gradientCheck2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M40 35 L45 40 L55 30"
                    fill="none"
                    stroke="url(#gradientCheck2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="40"
                    y1="50"
                    x2="60"
                    y2="50"
                    stroke="url(#gradientCheck2)"
                    strokeWidth="2"
                  />
                  <path
                    d="M40 60 L45 65 L55 55"
                    fill="none"
                    stroke="url(#gradientCheck2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-center">
                Анкета<br />работодателя
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("expert-open-lesson")}
          >
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              <div className="mb-4">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  className="text-purple-500"
                >
                  <defs>
                    <linearGradient id="gradientClip" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="25"
                    y="30"
                    width="50"
                    height="60"
                    rx="5"
                    fill="none"
                    stroke="url(#gradientClip)"
                    strokeWidth="3"
                  />
                  <path
                    d="M35 25 L35 35 L65 35 L65 25"
                    fill="none"
                    stroke="url(#gradientClip)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="62"
                    cy="45"
                    r="5"
                    fill="none"
                    stroke="url(#gradientClip)"
                    strokeWidth="2"
                  />
                  <line
                    x1="35"
                    y1="60"
                    x2="55"
                    y2="60"
                    stroke="url(#gradientClip)"
                    strokeWidth="2"
                  />
                  <line
                    x1="35"
                    y1="70"
                    x2="55"
                    y2="70"
                    stroke="url(#gradientClip)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p className="text-center">
                Чек-лист<br />по открытому занятию<br />(будет открыт ___)
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}