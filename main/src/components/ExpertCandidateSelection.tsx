import { Card, CardContent } from "./ui/card";
import { UserCircle, ChevronRight, Loader2 } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useCallback, useEffect, useState } from "react";
import { fetchCandidates, type CandidateItem } from "../services/candidates";
import type { Candidate } from "../types";

function toCandidate(u: CandidateItem): Candidate {
  return { id: u.id, name: u.name, position: u.position, department: u.department, applicationDate: u.applicationDate };
}

interface ExpertCandidateSelectionProps {
  onComplete: (candidate: Candidate) => void;
  onLogout: () => void;
}

export function ExpertCandidateSelection({ onComplete, onLogout }: ExpertCandidateSelectionProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await fetchCandidates();
    if (result.success) setCandidates(result.data.map(toCandidate));
    else setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <p className="text-sm text-gray-600">Роль</p>
              <div className="flex items-center gap-2">
                <p className="text-xl">Эксперт</p>
                <UserCircle className="h-8 w-8" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl mb-8">Выберите кандидата для оценки:</h2>

          {error && <p className="text-red-600 mb-4">{error}</p>}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-200"
                onClick={() => onComplete(candidate)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl mb-1">{candidate.name}</h3>
                          <p className="text-sm text-gray-500">
                            Дата подачи заявки: {candidate.applicationDate}
                          </p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0 ml-4" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 mb-1">Должность</p>
                          <p className="text-base">{candidate.position}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 mb-1">Кафедра</p>
                          <p className="text-base">{candidate.department}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {!loading && candidates.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                На данный момент нет кандидатов для оценки
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Выберите кандидата из списка для начала процесса экспертной оценки.
            Вам будут доступны учебно-методические материалы кандидата и формы для оценки.
          </p>
        </div>
      </main>
    </div>
  );
}
