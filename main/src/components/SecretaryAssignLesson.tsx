import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { TeacherNavigation } from "./TeacherNavigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ArrowLeft, QrCode, BarChart3 } from "lucide-react";
import { fetchUsers } from "../services/users";
import { fetchAllOpenClasses, createOpenClass } from "../services/openClasses";
import { StudentSurveyResults } from "./StudentSurveyResults";

interface Teacher {
  id: string;
  name: string;
}

interface Expert {
  id: string;
  name: string;
}

interface Lesson {
  id: number;
  teacher: string;
  date: string;
  time: string;
  room: string;
  experts: string[];
  qrLink: string;
}

interface SecretaryAssignLessonProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryAssignLesson({ onBack, onLogout }: SecretaryAssignLessonProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewingResults, setViewingResults] = useState<{ id: number; date: string; teacher: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetchUsers(),
      fetchAllOpenClasses(),
    ]).then(([usersRes, classesRes]) => {
      if (usersRes.success && usersRes.data) {
        setTeachers(usersRes.data.filter((u) => u.role === "Преподаватель").map((u) => ({ id: u.id, name: u.name })));
        setExperts(
          usersRes.data
            .filter((u) => u.role === "Эксперт" || u.role === "Внешний эксперт")
            .map((u) => ({ id: u.id, name: u.name }))
        );
      }
      if (classesRes.success && classesRes.data) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
        setLessons(
          classesRes.data.map((c) => ({
            id: c.id,
            teacher: c.teacher.name,
            date: c.date,
            time: c.time,
            room: c.room,
            experts: c.experts.map((e) => e.name),
            qrLink: `${baseUrl}#/student-checklist?lessonId=${c.id}`,
          }))
        );
      }
      setLoading(false);
    });
  }, []);

  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [lessonDetails, setLessonDetails] = useState({
    date: "",
    time: "",
    room: "",
  });
  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState("");

  const handleExpertToggle = (expertId: string) => {
    if (selectedExperts.includes(expertId)) {
      setSelectedExperts(selectedExperts.filter(id => id !== expertId));
    } else {
      setSelectedExperts([...selectedExperts, expertId]);
    }
  };

  const handleAssignLesson = async () => {
    if (!selectedTeacher || !lessonDetails.date || !lessonDetails.time || !lessonDetails.room) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    if (selectedExperts.length === 0) {
      alert("Пожалуйста, выберите хотя бы одного эксперта");
      return;
    }

    const teacher = teachers.find((t) => t.id === selectedTeacher);
    if (!teacher) return;

    setSubmitting(true);
    const res = await createOpenClass({
      teacherId: parseInt(selectedTeacher, 10),
      date: lessonDetails.date,
      time: lessonDetails.time,
      room: lessonDetails.room,
      expertIds: selectedExperts.map((id) => parseInt(id, 10)),
    });
    setSubmitting(false);

    if (res.success && res.id) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
      setLessons((prev) => [
        ...prev,
        {
          id: res.id!,
          teacher: teacher.name,
          date: lessonDetails.date,
          time: lessonDetails.time,
          room: lessonDetails.room,
          experts: selectedExperts.map((id) => experts.find((e) => e.id === id)?.name || ""),
          qrLink: `${baseUrl}#/student-checklist?lessonId=${res.id}`,
        },
      ]);
      setSelectedTeacher("");
      setLessonDetails({ date: "", time: "", room: "" });
      setSelectedExperts([]);
      alert("Открытое занятие успешно назначено!");
    } else {
      alert(res.error ?? "Ошибка при создании занятия");
    }
  };

  const handleShowQrCode = (qrLink: string) => {
    setCurrentQrCode(qrLink);
    setQrDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="mb-8">
          <p className="text-sm text-gray-600">Роль</p>
          <p className="text-xl">Секретарь</p>
        </div>

        <h2 className="text-2xl mb-8">Закрепление за ППС</h2>

        {viewingResults ? (
          <StudentSurveyResults
            lessonId={viewingResults.id}
            onBack={() => setViewingResults(null)}
            lessonInfo={{
              date: viewingResults.date,
              teacher: viewingResults.teacher
            }}
          />
        ) : loading ? (
          <p className="text-gray-600">Загрузка...</p>
        ) : (
          <div className="grid grid-cols-2 gap-8">
            {/* Форма назначения */}
            <div className="space-y-6">
              <Card className="border-2">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <Label className="mb-3 block">ФИО преподавателя</Label>
                    <div className="space-y-3">
                      {teachers.map((teacher) => (
                        <Card
                          key={teacher.id}
                          className={`cursor-pointer transition-all border-2 ${selectedTeacher === teacher.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                            }`}
                          onClick={() => setSelectedTeacher(teacher.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${selectedTeacher === teacher.id
                                ? "border-purple-500 bg-purple-500"
                                : "border-gray-300"
                                }`}>
                                {selectedTeacher === teacher.id && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm">{teacher.name}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="room">Аудитория</Label>
                        <Input
                          id="room"
                          placeholder="№"
                          value={lessonDetails.room}
                          onChange={(e) => setLessonDetails({ ...lessonDetails, room: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Дата</Label>
                        <Input
                          id="date"
                          type="date"
                          value={lessonDetails.date}
                          onChange={(e) => setLessonDetails({ ...lessonDetails, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Время</Label>
                        <Input
                          id="time"
                          type="time"
                          value={lessonDetails.time}
                          onChange={(e) => setLessonDetails({ ...lessonDetails, time: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Выбор экспертов */}
              <Card className="border-2">
                <CardContent className="p-6">
                  <Label className="mb-4 block">Выберите экспертов</Label>
                  <div className="space-y-3">
                    {experts.map((expert) => (
                      <div
                        key={expert.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleExpertToggle(expert.id)}
                      >
                        <Checkbox
                          id={`expert-${expert.id}`}
                          checked={selectedExperts.includes(expert.id)}
                          onCheckedChange={() => handleExpertToggle(expert.id)}
                        />
                        <Label
                          htmlFor={`expert-${expert.id}`}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600">А</span>
                          </div>
                          <span>{expert.name}</span>
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t text-center text-gray-500 italic">
                    <p className="text-sm">
                      Студенты увидят занятие после его назначения экспертам
                    </p>
                  </div>

                  <Button onClick={handleAssignLesson} className="w-full mt-6" disabled={submitting}>
                    {submitting ? "Создание..." : "Назначить занятие"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Список назначенных занятий */}
            <div>
              <h3 className="text-lg mb-4">Назначенные открытые занятия</h3>
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Преподаватель</p>
                          <p className="text-lg">{lesson.teacher}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Дата</p>
                            <p>{lesson.date}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Время</p>
                            <p>{lesson.time}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Аудитория</p>
                            <p>{lesson.room}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Эксперты</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {lesson.experts.map((expert, index) => (
                              <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {expert}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleShowQrCode(lesson.qrLink)}
                          >
                            <QrCode className="h-4 w-4" />
                            QR-код
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                            onClick={() => setViewingResults({ id: lesson.id, date: lesson.date, teacher: lesson.teacher })}
                          >
                            <BarChart3 className="h-4 w-4" />
                            Результаты
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {lessons.length === 0 && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-8 text-center text-gray-500">
                      Пока нет назначенных занятий
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>QR-код для чек-листа по открытому занятию</DialogTitle>
              <DialogDescription>
                Студенты могут отсканировать этот QR-код для доступа к чек-листу
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center">
              <div className="w-64 h-64 bg-white border-4 border-purple-500 rounded-lg flex items-center justify-center">
                <div className="text-center p-2">
                  <QrCode className="h-32 w-32 text-purple-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">Ссылка для чек-листа</p>
                  <p className="text-xs text-gray-500 mt-2 break-all">{currentQrCode}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}