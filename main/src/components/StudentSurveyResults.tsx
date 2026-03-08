import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { fetchStudentResults } from "../services/openClasses";
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
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStudentResults(lessonId).then((res) => {
            if (res.success) {
                setResults(res.data || []);
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

    const questions = [
        { id: "goalsCommunication", text: "Доведение целей и задач" },
        { id: "engagement", text: "Вовлечение участников" },
        { id: "questions", text: "Ответы на вопросы" },
        { id: "conclusion", text: "Подведение итогов" },
        { id: "evaluation", text: "Оценка результатов" },
    ];

    const calculateAverage = (qId: string) => {
        if (!results.length) return 0;
        const sum = results.reduce((acc, r) => acc + (parseInt(r.result[qId], 10) || 0), 0);
        return (sum / results.length).toFixed(1);
    };

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
                            Всего ответов
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{results.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Средние баллы по критериям</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {questions.map((q) => {
                            const avg = Number(calculateAverage(q.id));
                            const percentage = (avg / 3) * 100;
                            return (
                                <div key={q.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{q.text}</span>
                                        <span className="text-purple-600 font-bold">{avg} / 3</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {results.length === 0 && !error && (
                <p className="text-gray-500 text-center py-8">Пока нет ни одного ответа студентов.</p>
            )}
        </div>
    );
}
