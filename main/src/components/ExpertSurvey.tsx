import { Button } from "./ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { TeacherNavigation } from "./TeacherNavigation";
import { GiftFormRenderer, ParsedGiftData } from "./GiftFormRenderer";
import * as api from "../services/api";

interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  applicationDate: string;
}

interface ExpertSurveyProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertSurvey({ candidate, onBack, onLogout }: ExpertSurveyProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ParsedGiftData | null>(null);
  const [formId, setFormId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      // Ищем активную форму работодателя (expert type)
      const res = await api.get('/files/gift/forms');
      if (res.success && (res.data as any).success && Array.isArray((res.data as any).data)) {
        const forms = (res.data as any).data;
        const expertForm = forms.find((f: any) => f.formType === 'expert_file_eval');

        if (expertForm) {
          const formRes = await api.get(`/files/gift/form/${expertForm.id}`);
          if (formRes.success && (formRes.data as any).success && (formRes.data as any).data) {
            setFormData((formRes.data as any).data.parsedData);
            setFormId(expertForm.id);
          } else {
            setLoadError((formRes.data as any)?.message || formRes.error || "Ошибка при загрузке анкеты");
          }
        } else {
          setLoadError("Анкета работодателя (expert_file_eval) не найдена");
        }
      } else {
        setLoadError((res.data as any)?.message || res.error || "Ошибка при получении списка форм");
      }
      setLoading(false);
    }
    loadForm();
  }, []);

  const handleSubmit = async (answers: Record<number, any>) => {
    if (!candidate?.id || !formId) return;

    setIsSaving(true);
    // Для анкеты работодателя мы можем использовать тот же эндпоинт или создать новый.
    // Пока используем POST /open-classes/:id/expert-result для примера или аналогичный.
    // В данном контексте "Анкета работодателя" может быть связана с кандидатом напрямую.

    // Согласно schema.prisma, есть ResultFiles который связывает эксперта, учителя и форму.
    const res = await api.post('/files/result-files', {
      teacherId: parseInt(candidate.id, 10),
      formId: formId,
      result: answers
    });

    setIsSaving(false);

    if (res.success) {
      alert("Анкета работодателя успешно заполнена!");
      onBack();
    } else {
      alert("Ошибка при сохранении: " + res.error);
    }
  };

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

        <h2 className="text-2xl mb-8">Анкета работодателя</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-gray-50 rounded-xl border-2 border-dashed">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-500">Загрузка вопросов анкеты...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center bg-red-50 rounded-xl border-2 border-dashed border-red-200 text-red-800">
            <h3 className="text-xl font-bold mb-2">Ошибка загрузки анкеты</h3>
            <p className="mb-6">{loadError}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
              Попробовать снова
            </Button>
          </div>
        ) : formData ? (
          <GiftFormRenderer
            data={formData}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            submitLabel="Отправить анкету"
          />
        ) : (
          <div className="p-8 text-center bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
            Активная анкета работодателя не найдена. Пожалуйста, обратитесь к секретарю.
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Анкета работодателя является важной частью оценки кандидата. Ваше мнение как эксперта
            поможет принять взвешенное решение о приеме на работу.
          </p>
        </div>
      </main>
    </div>
  );
}
