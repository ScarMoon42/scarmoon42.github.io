import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { UserCircle, QrCode } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { fetchMyOpenClasses } from "../services/openClasses";
import type { OpenClassItem } from "../services/openClasses";

interface TeacherHomeProps {
  onNavigate: (page: "upload-umk" | "upload-pk" | "testing" | "student-checklist") => void;
  onNavigateToChecklist?: (lessonId: number) => void;
  onLogout: () => void;
}

export function TeacherHome({ onNavigate, onLogout }: TeacherHomeProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<OpenClassItem | null>(null);
  const [openClasses, setOpenClasses] = useState<OpenClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOpenClasses().then((res) => {
      if (res.success && res.data?.length) {
        setOpenClasses(res.data);
        setSelectedLesson(res.data[0]);
      }
      setLoading(false);
    });
  }, []);

  const displayLesson = selectedLesson ?? openClasses[0];
  const lessonDate = displayLesson?.date ?? "—";
  const lessonTime = displayLesson?.time ?? "—";
  const lessonRoom = displayLesson?.room ?? "—";
  const lessonQrLink = displayLesson
    ? `${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}#/student-checklist?lessonId=${displayLesson.id}`
    : "";

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-600">Роль</p>
              <div className="flex items-center gap-2">
                <p className="text-xl">Преподаватель</p>
                <UserCircle className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-xl mb-2">Информация о проведении открытого занятия:</h2>
            <p className="text-gray-700">{loading ? "Загрузка..." : `${lessonDate} (дата)`}</p>
            <p className="text-gray-700">{loading ? "" : `${lessonTime} (время)`}</p>
            <p className="text-gray-700">{loading ? "" : `${lessonRoom} (аудитория)`}</p>
            <div className="flex gap-2 justify-end mt-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setQrDialogOpen(true)}
                disabled={!displayLesson}
              >
                <QrCode className="h-4 w-4" />
                QR-код
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-lg mb-4">
            Приветствуем Вас, Уважаемый преподаватель! Мы просим Вас загрузить
          </p>
          <p className="text-lg mb-4">
            учебно-методический комплекс (УМК), курсовые проекты (КП) и документы о повышении квалификации (ПК).
          </p>
          <p className="text-lg mb-4">
            Также, Вам необходимо пройти тестирование, которое проводится для оценки
          </p>
          <p className="text-lg mb-4">
            уровня знаний претендента в области проектной деятельности, методов обучения
          </p>
          <p className="text-lg mb-6">
            и эффективной коммуникации с обучающимися.
          </p>
          <p className="text-lg">
            Благодарим за участие!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-12">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("upload-umk")}
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
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="20"
                    y="30"
                    width="80"
                    height="60"
                    rx="5"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="3"
                  />
                  <line
                    x1="30"
                    y1="50"
                    x2="70"
                    y2="50"
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="60"
                    x2="70"
                    y2="60"
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                  />
                  <line
                    x1="30"
                    y1="70"
                    x2="60"
                    y2="70"
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                  />
                  <rect
                    x="75"
                    y="55"
                    width="20"
                    height="15"
                    rx="2"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p className="text-center text-lg">
                Загрузка УМК,<br />КП
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("upload-pk")}
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
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M35 25 L85 25 L95 35 L95 85 L35 85 Z"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="3"
                  />
                  <line
                    x1="85"
                    y1="25"
                    x2="95"
                    y2="35"
                    stroke="url(#gradient2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M45 45 L75 45 L75 70 L45 70 Z"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="2"
                  />
                  <path
                    d="M55 60 L60 65 L65 55"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="60,75 60,90 50,85"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-center text-lg">
                Загрузка ПК
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2"
            onClick={() => onNavigate("testing")}
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
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#e91e63" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="25"
                    y="20"
                    width="70"
                    height="80"
                    rx="5"
                    fill="none"
                    stroke="url(#gradient3)"
                    strokeWidth="3"
                  />
                  <rect
                    x="38"
                    y="35"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                  />
                  <line
                    x1="55"
                    y1="40"
                    x2="80"
                    y2="40"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                  />
                  <rect
                    x="38"
                    y="55"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                  />
                  <line
                    x1="55"
                    y1="60"
                    x2="80"
                    y2="60"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                  />
                  <rect
                    x="38"
                    y="75"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                  />
                  <line
                    x1="55"
                    y1="80"
                    x2="80"
                    y2="80"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <p className="text-center text-lg">
                Тестирование
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR-код для чек-листа</DialogTitle>
            <DialogDescription>Студенты могут отсканировать этот код для оценки занятия</DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center">
            <div className="p-4 bg-white border-4 border-purple-500 rounded-xl shadow-inner">
              {lessonQrLink ? (
                <QRCodeCanvas
                  value={lessonQrLink}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                  Загрузка...
                </div>
              )}
            </div>

            <div className="mt-6 w-full space-y-4">
              {openClasses.length > 1 && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-medium px-1">Выбрать другое занятие:</label>
                  <select
                    className="w-full text-sm border rounded-md p-2 bg-gray-50"
                    value={selectedLesson?.id ?? ""}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const lesson = openClasses.find((l) => l.id === id);
                      if (lesson) setSelectedLesson(lesson);
                    }}
                  >
                    {openClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.date} — {c.room}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-400 break-all mb-4 px-4">{lessonQrLink}</p>
                <Button
                  className="w-full"
                  onClick={() => {
                    const win = window.open(lessonQrLink, "_blank");
                    if (win) win.focus();
                  }}
                >
                  Перейти по ссылке
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
