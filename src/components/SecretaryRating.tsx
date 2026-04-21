import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, Award, Loader2 } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useState, useEffect } from "react";
import { fetchRanking, type RankingTeacher } from "../services/users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";


interface SecretaryRatingProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryRating({ onBack, onLogout }: SecretaryRatingProps) {
  const [teachers, setTeachers] = useState<RankingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<RankingTeacher | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    async function loadRanking() {
      setLoading(true);
      setError(null);
      const res = await fetchRanking();
      if (res.success) {
        setTeachers(res.data);
      } else {
        setError(res.error || "Не удалось загрузить рейтинг");
      }
      setLoading(false);
    }
    loadRanking();
  }, []);

  const sortedTeachers = [...teachers].sort((a, b) => b.rating - a.rating);

  const handleShowDetails = (teacher: RankingTeacher) => {
    setSelectedTeacher(teacher);
    setDetailsOpen(true);
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

        <h2 className="text-2xl mb-8">Рейтинг ППС</h2>
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            <p className="mt-4 text-gray-500">Загрузка рейтинга...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 p-12">
            <p className="text-red-700 font-medium mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Попробовать снова
            </Button>
          </div>
        ) : sortedTeachers.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12">
            <p className="text-gray-500">Данные о преподавателях не найдены. Убедитесь, что в системе есть пользователи с ролью "Преподаватель".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTeachers.map((teacher, index) => (
              <Card
                key={teacher.id}
                className="border-2 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleShowDetails(teacher)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <Award className="h-8 w-8 text-yellow-500" />
                      )}
                      {index === 1 && (
                        <Award className="h-8 w-8 text-gray-400" />
                      )}
                      {index === 2 && (
                        <Award className="h-8 w-8 text-orange-600" />
                      )}
                      {index > 2 && (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600">#{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl text-purple-600">{teacher.rating}</div>
                      <div className="text-xs text-gray-500">баллов</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">ППС</p>
                    <p className="text-lg">{teacher.name}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Должность:</span>
                      <span>{teacher.position}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Кафедра:</span>
                      <span>{teacher.department}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${teacher.rating}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детальная оценка</DialogTitle>
              <DialogDescription>Подробная информация о рейтинге преподавателя</DialogDescription>
            </DialogHeader>
            {selectedTeacher && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ФИО Преподавателя</p>
                  <p className="text-xl mb-2">{selectedTeacher.name}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Должность: </span>
                      <span>{selectedTeacher.position}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Кафедра: </span>
                      <span>{selectedTeacher.department}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-2xl text-purple-600">{selectedTeacher.rating}</span>
                    <span className="text-gray-600"> баллов</span>
                  </div>
                </div>

                <div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-4 py-3 text-left">Категория</th>
                          <th className="px-4 py-3 text-center w-32">Оценка</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeacher.details.map((detail, index) => (
                          <tr
                            key={index}
                            className={`border-t border-blue-200 ${detail.maxScore === 0 ? "bg-blue-50" : "bg-white"
                              }`}
                          >
                            <td className="px-4 py-3">
                              <span className={detail.maxScore === 0 ? "" : "ml-4"}>
                                {detail.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {detail.maxScore > 0 ? (
                                <span>
                                  {detail.score}/{detail.maxScore}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-100 border-t-2 border-blue-300">
                          <td className="px-4 py-3">
                            <strong>Всего</strong>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <strong>{selectedTeacher.rating}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}