import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { GiftFormRenderer, type ParsedGiftData } from "./GiftFormRenderer";
import * as api from "../services/api";
import type { Candidate } from "../types";

interface ExpertKpUmkProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertKpUmk({ candidate, onBack, onLogout }: ExpertKpUmkProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ParsedGiftData | null>(null);
  const [formId, setFormId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setLoadError(null);

      const res = await api.get("/files/gift/forms");
      if (!res.success) {
        setLoadError(res.error || "Ошибка при получении списка форм");
        setLoading(false);
        return;
      }

      const forms = (res.data as any)?.data;
      if (!Array.isArray(forms)) {
        setLoadError("Неверный ответ сервера при получении форм");
        setLoading(false);
        return;
      }

      const expertForm = forms.find((f: any) => f.formType === "expert_kp_umk");
      if (!expertForm) {
        setLoadError("Анкета эксперта (Оценка КП/УМК) не найдена. Пожалуйста, обратитесь к секретарю.");
        setLoading(false);
        return;
      }

      const formRes = await api.get(`/files/gift/form/${expertForm.id}`);
      if (!formRes.success) {
        setLoadError(formRes.error || "Ошибка при загрузке формы");
        setLoading(false);
        return;
      }

      const formDataPayload = (formRes.data as any)?.data;
      if (!formDataPayload?.parsedData) {
        setLoadError("Содержимое формы отсутствует или повреждено");
        setLoading(false);
        return;
      }

      setFormData(formDataPayload.parsedData);
      setFormId(expertForm.id);
      setLoading(false);
    }

    loadForm();
  }, []);

  const handleSubmit = async (answers: Record<number, any>) => {
    if (!candidate?.id || !formId) return;

    setIsSaving(true);
    const res = await api.post("/files/gift/resource/" + formId + "/submit", {
      teacherId: parseInt(candidate.id, 10),
      answers,
    });
    setIsSaving(false);

    if (!res.success) {
      alert(res.error || "Ошибка при сохранении результата");
      return;
    }

    alert("Оценка КП/УМК успешно сохранена");
    onBack();
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
            <p className="text-lg">
              {candidate.name} — {candidate.position}, кафедра {candidate.department}
            </p>
          </div>
        )}

        <h2 className="text-2xl mb-8">Оценка КП/УМК</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-gray-50 rounded-xl border-2 border-dashed">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-500">Загрузка формы оценки...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center bg-red-50 rounded-xl border-2 border-dashed border-red-200 text-red-800">
            <h3 className="text-xl font-bold mb-2">Ошибка загрузки формы</h3>
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
            submitLabel="Отправить оценку"
          />
        ) : (
          <div className="p-8 text-center bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
            Форма не найдена. Пожалуйста, загрузите анкету через секретаря.
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Этот тест используется для оценки КП/УМК и учитывается в рейтинге преподавателя.
          </p>
        </div>
      </main>
    </div>
  );
}
