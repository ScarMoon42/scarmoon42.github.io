import { Button } from "./ui/button";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
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

interface ExpertOpenLessonProps {
  candidate: Candidate | null;
  onBack: () => void;
  onLogout: () => void;
}

export function ExpertOpenLesson({ candidate, onBack, onLogout }: ExpertOpenLessonProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ParsedGiftData | null>(null);
  const [openClassId, setOpenClassId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Получаем список открытых занятий эксперта
      const classesRes = await api.get<{
        data?: Array<{ id: number; teacherId: number }>;
      }>('/open-classes/expert/my-classes');
      if (classesRes.success && Array.isArray((classesRes.data as { data?: Array<{ id: number; teacherId: number }> } | undefined)?.data)) {
        const classes = ((classesRes.data as { data?: Array<{ id: number; teacherId: number }> }).data ?? []);
        const myClass = classes.find((c) => candidate && String(c.teacherId) === candidate.id);
        if (myClass) {
          setOpenClassId(myClass.id);
        } else {
          console.warn('Open class not found for candidate', candidate?.name);
        }
      } else {
        console.error('My classes load error:', classesRes);
      }

      // 2. Получаем форму чек-листа (expert type)
      const formsRes = await api.get('/files/gift/forms');
      if (formsRes.success && (formsRes.data as any).success && Array.isArray((formsRes.data as any).data)) {
        const forms = (formsRes.data as any).data;
        const expertForm = forms.find((f: any) => f.formType === 'expert_open_lesson');

        if (expertForm) {
          const formRes = await api.get(`/files/gift/form/${expertForm.id}`);
          if (formRes.success && (formRes.data as any).success && (formRes.data as any).data) {
            setFormData((formRes.data as any).data.parsedData);
          } else {
            setLoadError((formRes.data as any)?.message || formRes.error || "Ошибка при загрузке чек-листа");
          }
        } else {
          setLoadError("Чек-лист открытого занятия (expert_open_lesson) не найден");
        }
      } else {
        setLoadError((formsRes.data as any)?.message || formsRes.error || "Ошибка при получении списка форм");
      }
      setLoading(false);
    }
    loadData();
  }, [candidate]);

  const handleSubmit = async (answers: Record<number, any>) => {
    if (!openClassId) {
      alert("Не найдено открытое занятие для оценки.");
      return;
    }

    setIsSaving(true);
    const res = await api.post(`/open-classes/${openClassId}/expert-result`, {
      result: answers
    });
    setIsSaving(false);

    if (res.success) {
      alert("Чек-лист по открытому занятию успешно сохранен!");
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
            <p className="text-lg">
              {candidate.name} — {candidate.position}, кафедра {candidate.department}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl">Чек-лист по открытому занятию</h2>
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Будет доступен в назначенное время</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-gray-50 rounded-xl border-2 border-dashed">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-500">Загрузка чек-листа...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center bg-red-50 rounded-xl border-2 border-dashed border-red-200 text-red-800">
            <h3 className="text-xl font-bold mb-2">Ошибка загрузки чек-листа</h3>
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
            submitLabel="Сохранить чек-лист"
          />
        ) : (
          <div className="p-8 text-center bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
            Активный чек-лист открытого занятия не найден. Пожалуйста, обратитесь к секретарю.
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Чек-лист будет доступен для заполнения во время проведения открытого занятия.
            Пожалуйста, внимательно наблюдайте за проведением занятия и объективно оцените
            профессиональные навыки кандидата.
          </p>
        </div>
      </main>
    </div>
  );
}
