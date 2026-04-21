import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useState, useEffect } from "react";
import { submitStudentResult } from "../services/openClasses";
import { GiftFormRenderer, ParsedGiftData } from "./GiftFormRenderer";
import * as api from "../services/api";
import { Loader2 } from "lucide-react";

interface StudentChecklistProps {
  lessonId?: string | number;
}

// Уникальный идентификатор студента (анонимный)
const getSSID = () => {
  let ssid = localStorage.getItem("survey_ssid");
  if (!ssid) {
    ssid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("survey_ssid", ssid);
  }
  return ssid;
};

export function StudentChecklist({ lessonId }: StudentChecklistProps) {
  const [formData, setFormData] = useState<ParsedGiftData | null>(null);
  const [formName, setFormName] = useState("");
  const [loading, setLoading] = useState(true);
  const [ssid, setSsid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSsid(getSSID());
    async function loadForm() {
      setLoading(true);
      // Загружаем актуальную анкету для студентов
      const res = await api.get('/files/gift/forms/student');
      if (res.success && (res.data as any).success) {
        const payload = (res.data as any).data;
        setFormData(payload.parsedData);
        setFormName(payload.name);
      } else {
        const msg = (res.data as any)?.message || res.error || "Анкета не найдена";
        console.error('Student form load error:', res);
        setLoadError(msg);
      }
      setLoading(false);
    }
    loadForm();
  }, []);

  const handleSubmit = async (answers: Record<number, any>) => {
    setSubmitError(null);
    const lid = typeof lessonId === "string" ? parseInt(lessonId, 10) : lessonId;
    if (!lid) {
      alert("Не указано занятие. Откройте страницу по QR-коду.");
      return;
    }

    setSubmitting(true);
    // Мапим ответы в формат, ожидаемый бэкендом (простой объект ключ-значение)
    const res = await submitStudentResult(lid, answers, ssid);
    setSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setSubmitError(res.error || "Ошибка отправки");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md w-full border-2 border-green-100 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Спасибо!</h2>
            <p className="text-gray-600">Ваша оценка успешно отправлена и будет учтена анонимно.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="mx-auto max-w-4xl px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formName || "Чек-лист занятия"}
            </h1>
            <p className="text-gray-500 text-sm">Оценка студента {lessonId ? `(ID: ${lessonId})` : ""}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            <p className="mt-4 text-gray-500">Загрузка анкеты...</p>
          </div>
        ) : loadError ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50/20 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Не удалось загрузить анкету</h3>
            <p className="text-red-700 max-w-md mb-6">{loadError}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
              Попробовать снова
            </Button>
          </div>
        ) : formData ? (
          <div className="space-y-6">
            <Card className="border-2 border-blue-50 bg-blue-50/30">
              <CardContent className="p-6">
                <p className="text-sm text-blue-800">
                  Пожалуйста, ответьте на вопросы анкеты. Ваши ответы помогут нам улучшить качество занятий.
                </p>
              </CardContent>
            </Card>

            <GiftFormRenderer
              data={formData}
              onSubmit={handleSubmit}
              isSaving={submitting}
              submitLabel="Отправить оценку"
            />

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                {submitError}
              </div>
            )}

            <p className="mt-8 text-center text-xs text-gray-400">
              Ваши данные передаются анонимно. SSID: {ssid.slice(0, 8)}...
            </p>
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">Анкета не найдена или еще не загружена администратором.</p>
          </div>
        )}
      </main>
    </div>
  );
}
