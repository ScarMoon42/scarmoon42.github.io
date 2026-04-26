import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { fetchLessonResultsSummary } from "../services/openClasses";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface ResultsProps {
    lessonId: number;
    onBack: () => void;
    lessonInfo?: {
        date: string;
        teacher: string;
    };
}

export function StudentSurveyResults({ lessonId, onBack, lessonInfo }: ResultsProps) {
    const [summary, setSummary] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLessonResultsSummary(lessonId).then((res) => {
            if (res.success) {
                setSummary(res.data || null);
            } else {
                setError(res.error || "Ошибка загрузки");
            }
            setLoading(false);
        });
    }, [lessonId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                <p>Загрузка результатов опроса...</p>
            </div>
        );
    }

    const teacherTest = summary?.teacherTest?.summary;
    const students = summary?.students;
    const expertsOpenLesson = summary?.expertsOpenLesson;
    const expertsFileEval = summary?.expertsFileEval;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Результаты опроса студентов</h2>
                    {lessonInfo && (
                        <p className="text-gray-600">
                            Занятие: {lessonInfo.date}, Преподаватель: {lessonInfo.teacher}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-2 border-purple-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Ответов студентов
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{students?.totalResponses ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-purple-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Эксперты: открытое занятие
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{expertsOpenLesson?.totalResponses ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-purple-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Эксперты: оценка файлов
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{expertsFileEval?.totalResponses ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Тест преподавателя (правильность ответов)</CardTitle>
                </CardHeader>
                <CardContent>
                    {!summary?.teacherTest?.hasSubmission ? (
                        <p className="text-gray-500">Преподаватель пока не прошел тест.</p>
                    ) : teacherTest ? (
                        <div className="space-y-4">
                            {summary?.teacherTest?.testName && (
                                <p className="text-sm text-gray-600">
                                    Версия теста: {summary.teacherTest.testName}
                                </p>
                            )}
                            <p className="font-medium">
                                Правильных ответов: {teacherTest.correctAnswers} из {teacherTest.totalQuestions}
                            </p>
                            <div className="space-y-3">
                                {teacherTest.questions.map((q: any) => (
                                    <div key={q.questionIndex} className="rounded border p-3">
                                        <p className="font-medium mb-2">{q.questionText}</p>
                                        <p className="text-sm">Ответ преподавателя: <span className="font-semibold">{q.selectedAnswer || "—"}</span></p>
                                        <p className="text-sm">Правильный ответ: <span className="font-semibold">{(q.correctAnswers || []).join(", ") || "—"}</span></p>
                                        <p className={`text-sm mt-1 ${q.isCorrect ? "text-green-700" : "text-red-700"}`}>
                                            {q.isCorrect ? "Верно" : "Неверно"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Данные теста недоступны.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Распределение ответов студентов</CardTitle>
                </CardHeader>
                <CardContent>
                    {!students?.forms?.length ? (
                        <p className="text-gray-500">Нет данных по ответам студентов.</p>
                    ) : (
                        <div className="space-y-4">
                            {students.forms.map((form: any) => (
                                <div key={form.formId} className="rounded border p-3 space-y-3">
                                    <div>
                                        <p className="font-medium">{form.formName || `Форма #${form.formId}`}</p>
                                        <p className="text-sm text-gray-600">Ответов по версии: {form.totalResponses}</p>
                                    </div>
                                    {form.questions.map((q: any) => (
                                        <div key={`${form.formId}-${q.questionIndex}`} className="rounded border p-3">
                                            <p className="font-medium mb-2">{q.questionText}</p>
                                            <div className="space-y-1">
                                                {q.answers.map((a: any, idx: number) => (
                                                    <p key={idx} className="text-sm">
                                                        {a.answer}: <span className="font-semibold">{a.count}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Распределение ответов экспертов (открытое занятие)</CardTitle>
                </CardHeader>
                <CardContent>
                    {!expertsOpenLesson?.forms?.length ? (
                        <p className="text-gray-500">Нет данных по экспертам для открытого занятия.</p>
                    ) : (
                        <div className="space-y-4">
                            {expertsOpenLesson.forms.map((form: any) => (
                                <div key={form.formId} className="rounded border p-3 space-y-3">
                                    <div>
                                        <p className="font-medium">{form.formName || `Форма #${form.formId}`}</p>
                                        <p className="text-sm text-gray-600">Ответов по версии: {form.totalResponses}</p>
                                    </div>
                                    {form.questions.map((q: any) => (
                                        <div key={`${form.formId}-${q.questionIndex}`} className="rounded border p-3">
                                            <p className="font-medium mb-2">{q.questionText}</p>
                                            <div className="space-y-1">
                                                {q.answers.map((a: any, idx: number) => (
                                                    <p key={idx} className="text-sm">
                                                        {a.answer}: <span className="font-semibold">{a.count}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Распределение ответов экспертов (оценка файлов)</CardTitle>
                </CardHeader>
                <CardContent>
                    {!expertsFileEval?.forms?.length ? (
                        <p className="text-gray-500">Нет данных по экспертной оценке файлов.</p>
                    ) : (
                        <div className="space-y-4">
                            {expertsFileEval.forms.map((form: any) => (
                                <div key={form.formId} className="rounded border p-3 space-y-3">
                                    <div>
                                        <p className="font-medium">{form.formName || `Форма #${form.formId}`}</p>
                                        <p className="text-sm text-gray-600">Ответов по версии: {form.totalResponses}</p>
                                    </div>
                                    {form.questions.map((q: any) => (
                                        <div key={`${form.formId}-${q.questionIndex}`} className="rounded border p-3">
                                            <p className="font-medium mb-2">{q.questionText}</p>
                                            <div className="space-y-1">
                                                {q.answers.map((a: any, idx: number) => (
                                                    <p key={idx} className="text-sm">
                                                        {a.answer}: <span className="font-semibold">{a.count}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {!summary && !loading && !error && (
                <p className="text-gray-500 text-center py-8">Данные по результатам пока отсутствуют.</p>
            )}
        </div>
    );
}
