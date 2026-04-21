import { Button } from "./ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TeacherNavigation } from "./TeacherNavigation";
import { GiftFormRenderer, ParsedGiftData } from "./GiftFormRenderer";
import * as api from "../services/api";

interface TestingProps {
  onBack: () => void;
  onLogout: () => void;
}

export function Testing({ onBack, onLogout }: TestingProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ParsedGiftData | null>(null);
  const [formName, setFormName] = useState("");
  const [testId, setTestId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTest() {
      setLoading(true);
      const res = await api.get('/files/gift/forms');
      if (res.success && (res.data as any).success && Array.isArray((res.data as any).data)) {
        const forms = (res.data as any).data;
        const teacherTest = forms.find((f: any) => f.formType === 'teacher_test');

        if (teacherTest) {
          setFormName(teacherTest.name);
          setTestId(teacherTest.id);

          const testRes = await api.get(`/files/gift/form/${teacherTest.id}`);
          if (testRes.success && (testRes.data as any).success && (testRes.data as any).data) {
            setFormData((testRes.data as any).data.parsedData);
          } else {
            setLoadError((testRes.data as any)?.message || testRes.error || "Ошибка при загрузке теста");
          }
        } else {
          setLoadError("Тест для преподавателей не найден");
        }
      } else {
        setLoadError((res.data as any)?.message || res.error || "Ошибка при получении списка форм");
      }
      setLoading(false);
    }
    loadTest();
  }, []);

  const handleSubmit = async (answers: Record<number, any>) => {
    if (!testId) return;

    setIsSaving(true);
    // Отправляем результат теста через универсальный эндпоинт
    const res = await api.post(`/files/gift/resource/${testId}/submit`, {
      answers
    });
    setIsSaving(false);

    if (res.success) {
      alert("Тестирование успешно завершено! Ваши ответы отправлены.");
      onBack();
    } else {
      alert("Ошибка при сохранении результатов: " + res.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <TeacherNavigation onLogout={onLogout} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад к списку
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{formName || "Тестирование"}</h1>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            <p className="mt-4 text-gray-500">Загрузка вопросов теста...</p>
          </div>
        ) : loadError ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50/20 p-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ошибка загрузки теста</h3>
            <p className="text-red-700 max-w-md">{loadError}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-50">
              Попробовать снова
            </Button>
          </div>
        ) : formData ? (
          <GiftFormRenderer
            data={formData}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">Тест не найден или еще не загружен администратором.</p>
          </div>
        )}
      </main>
    </div>
  );
}
