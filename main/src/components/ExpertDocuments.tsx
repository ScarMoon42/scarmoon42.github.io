import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, Download, FileText, CheckCircle2, AlertCircle, Save, Loader2 } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useState, useEffect } from "react";
import { getFilesByUserId, downloadFile, evaluateFile } from "../services/files";
import type { FileItem } from "../services/files";
import { Textarea } from "./ui/textarea";

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  applicationDate: string;
}

interface ExpertDocumentsProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertDocuments({ candidate, onBack, onLogout }: ExpertDocumentsProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Локальные состояния для редактирования комментариев и статусов
  const [editStates, setEditStates] = useState<Record<number, { status: string; comment: string }>>({});

  useEffect(() => {
    if (candidate?.id) {
      loadFiles();
    } else {
      setLoading(false);
    }
  }, [candidate?.id]);

  const loadFiles = async () => {
    if (!candidate?.id) return;
    setLoading(true);
    const res = await getFilesByUserId(candidate.id);
    if (res.success && res.files) {
      setFiles(res.files);
      // Инициализируем состояния редактирования
      const initialStates: Record<number, { status: string; comment: string }> = {};
      res.files.forEach(f => {
        initialStates[f.id] = {
          status: f.status || 'uploaded',
          comment: f.expertComment || ''
        };
      });
      setEditStates(initialStates);
    }
    setLoading(false);
  };

  const handleDownload = async (file: FileItem) => {
    setDownloadingId(file.id);
    try {
      await downloadFile(file.id, file.name);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка скачивания");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = (fileId: number, status: string) => {
    setEditStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], status }
    }));
  };

  const handleCommentChange = (fileId: number, comment: string) => {
    setEditStates(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], comment }
    }));
  };

  const handleSaveEvaluation = async (fileId: number) => {
    const state = editStates[fileId];
    if (!state) return;

    setSavingId(fileId);
    const res = await evaluateFile(fileId, state.status, state.comment);
    setSavingId(null);

    if (res.success) {
      // Обновляем локальный список файлов
      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? { ...f, status: state.status, expertComment: state.comment }
          : f
      ));
      alert("Оценка сохранена");
    } else {
      alert("Ошибка: " + res.error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Принято":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "Требует доработки":
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
      default:
        return <FileText className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-gray-600">Роль</p>
                <p className="text-xl">Эксперт</p>
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
            <div className="mb-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Кандидат:</p>
              <p className="text-lg">{candidate.name} — {candidate.position}, кафедра {candidate.department}</p>
            </div>
          )}

          <h2 className="text-2xl mb-8 font-semibold">Оценка документов УМК, КП</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 bg-gray-50 rounded-xl border-2 border-dashed">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-500">Загрузка документов...</p>
            </div>
          ) : files.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center text-gray-500">
                Кандидат пока не загрузил файлы
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {files.map((file) => (
                <Card key={file.id} className="overflow-hidden border-2 hover:border-purple-200 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {getStatusIcon(editStates[file.id]?.status || file.status)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{file.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider">
                              {file.type}
                            </span>
                            <span>•</span>
                            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2"
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                      >
                        {downloadingId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Скачать
                      </Button>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-shrink-0 min-w-[200px]">
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                            Статус проверки
                          </label>
                          <select
                            className="w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none transition-colors"
                            value={editStates[file.id]?.status}
                            onChange={(e) => handleStatusChange(file.id, e.target.value)}
                          >
                            <option value="uploaded">Загружен (ожидает)</option>
                            <option value="Принято">Принято</option>
                            <option value="Требует доработки">Требует доработки</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                            Комментарий эксперта
                          </label>
                          <Textarea
                            placeholder="Укажите рекомендации или причины возврата..."
                            className="min-h-[80px] bg-white border-2 border-gray-200"
                            value={editStates[file.id]?.comment}
                            onChange={(e) => handleCommentChange(file.id, e.target.value)}
                          />
                        </div>
                        <div className="flex-shrink-0 self-end">
                          <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleSaveEvaluation(file.id)}
                            disabled={savingId === file.id}
                          >
                            {savingId === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Сохранить
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-8 bg-purple-50 rounded-lg p-5 border border-purple-100">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <p className="text-sm text-purple-800 leading-relaxed">
                Документы предоставлены кандидатом для оценки. Ваши комментарии и статусы будут видны
                преподавателю в режиме реального времени. После ознакомления с материалами,
                пожалуйста, также заполните анкету работодателя.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
