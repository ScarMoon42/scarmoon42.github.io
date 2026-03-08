import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TeacherNavigation } from "./TeacherNavigation";
import { getFilesByUserId } from "../services/files";
import { saveFileEvaluation, getFileEvaluation } from "../services/fileResults";
import type { FileItem } from "../services/files";

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  applicationDate: string;
}

interface ExpertChecklistProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertChecklist({ candidate, onBack, onLogout }: ExpertChecklistProps) {
  const [checklist, setChecklist] = useState({
    umkComplete: false,
    umkActual: false,
    kpComplete: false,
    kpQuality: false,
    materialsStructured: false,
  });

  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (candidate?.id) {
      const teacherId = parseInt(candidate.id, 10);
      Promise.all([
        getFilesByUserId(candidate.id),
        getFileEvaluation(teacherId)
      ]).then(([filesRes, evalRes]) => {
        if (filesRes.success && filesRes.files) {
          setFiles(filesRes.files);
        }
        if (evalRes.success && evalRes.data) {
          const evalData = evalRes.data as any;
          const result = evalData.result;
          setChecklist({
            umkComplete: !!result.umkComplete,
            umkActual: !!result.umkActual,
            kpComplete: !!result.kpComplete,
            kpQuality: !!result.kpQuality,
            materialsStructured: !!result.materialsStructured,
          });
          setComments(result.comments || "");
        }
        setLoading(false);
      }).catch(err => {
        console.error("Data loading error", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [candidate?.id]);

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setChecklist({ ...checklist, [key]: checked });
  };

  const handleSubmit = async () => {
    if (!candidate?.id) return;

    setSaving(true);
    const teacherId = parseInt(candidate.id, 10);
    const fileIds = files.map(f => f.id);
    const result = { ...checklist, comments };

    const res = await saveFileEvaluation(teacherId, result, fileIds);
    setSaving(false);

    if (res.success) {
      alert("Чек-лист сохранен!");
      onBack();
    } else {
      alert("Ошибка сохранения: " + res.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TeacherNavigation showLogout onLogout={onLogout} />
        <div className="flex flex-col items-center justify-center p-24">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-500">Загрузка данных для оценки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        {candidate && (
          <div className="mb-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Кандидат:</p>
            <p className="text-lg">{candidate.name} — {candidate.position}, кафедра {candidate.department}</p>
          </div>
        )}

        <h2 className="text-2xl mb-8">Чек-лист по УМК, КП</h2>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Оценка учебно-методических материалов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id="umkComplete"
                  checked={checklist.umkComplete}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("umkComplete", checked as boolean)
                  }
                />
                <Label
                  htmlFor="umkComplete"
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  УМК содержит все необходимые компоненты (рабочая программа, методические указания,
                  оценочные материалы)
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id="umkActual"
                  checked={checklist.umkActual}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("umkActual", checked as boolean)
                  }
                />
                <Label
                  htmlFor="umkActual"
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  Содержание УМК соответствует актуальным требованиям ФГОС и профессиональным стандартам
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id="kpComplete"
                  checked={checklist.kpComplete}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("kpComplete", checked as boolean)
                  }
                />
                <Label
                  htmlFor="kpComplete"
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  Курсовые проекты содержат четкие методические указания для студентов
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id="kpQuality"
                  checked={checklist.kpQuality}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("kpQuality", checked as boolean)
                  }
                />
                <Label
                  htmlFor="kpQuality"
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  Тематика курсовых проектов актуальна и способствует развитию профессиональных компетенций
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id="materialsStructured"
                  checked={checklist.materialsStructured}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("materialsStructured", checked as boolean)
                  }
                />
                <Label
                  htmlFor="materialsStructured"
                  className="flex-1 cursor-pointer leading-relaxed"
                >
                  Материалы хорошо структурированы и удобны для использования в учебном процессе
                </Label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="comments" className="mb-3 block">
                Комментарии и рекомендации
              </Label>
              <Textarea
                id="comments"
                placeholder="Введите ваши комментарии и рекомендации по улучшению материалов..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onBack} disabled={saving}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить оценку"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-100">
            <p className="text-sm text-purple-700 font-medium mb-1">
              Оцениваемые файлы ({files.length}):
            </p>
            <div className="text-xs text-purple-600 flex flex-wrap gap-2">
              {files.map(f => (
                <span key={f.id} className="bg-white px-2 py-1 rounded border border-purple-200">
                  {f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Пожалуйста, тщательно оцените предоставленные материалы. Ваша оценка поможет
            принять решение о соответствии кандидата требованиям должности.
          </p>
        </div>
      </main>
    </div>
  );
}
