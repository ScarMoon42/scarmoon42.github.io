import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export interface GiftQuestion {
    title?: string;
    text: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'numerical' | 'matching';
    options?: {
        text: string;
        isCorrect: boolean;
        feedback?: string;
    }[];
    correctAnswers?: string[];
    feedback?: string;
}

export interface ParsedGiftData {
    questions: GiftQuestion[];
    questionCount: number;
}

interface GiftFormRendererProps {
    data: ParsedGiftData;
    onSubmit: (answers: Record<number, any>) => void;
    isSaving?: boolean;
    submitLabel?: string;
    showNavigation?: boolean;
}

export function GiftFormRenderer({
    data,
    onSubmit,
    isSaving = false,
    submitLabel = "Завершить",
    showNavigation = true
}: GiftFormRendererProps) {
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});

    const questions = data.questions;
    const currentQuestion = questions[currentQuestionIdx];

    const handleAnswerChange = (value: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestionIdx]: value }));
    };

    const nextQuestion = () => {
        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIdx > 0) {
            setCurrentQuestionIdx(currentQuestionIdx - 1);
        }
    };

    const handleSubmit = () => {
        onSubmit(answers);
    };

    if (!questions || questions.length === 0) {
        return <div className="text-gray-500 p-8 text-center">Нет доступных вопросов.</div>;
    }

    const renderQuestionInput = () => {
        switch (currentQuestion.type) {
            case 'multiple_choice':
            case 'true_false':
                return (
                    <RadioGroup
                        value={answers[currentQuestionIdx] || ""}
                        onValueChange={handleAnswerChange}
                    >
                        <div className="space-y-3">
                            {currentQuestion.options?.map((option, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                                    <RadioGroupItem value={option.text} id={`opt-${index}`} />
                                    <Label htmlFor={`opt-${index}`} className="flex-1 cursor-pointer py-1">
                                        {option.text}
                                    </Label>
                                </div>
                            ))}
                            {currentQuestion.type === 'true_false' && !currentQuestion.options && (
                                <>
                                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                                        <RadioGroupItem value="true" id="true" />
                                        <Label htmlFor="true" className="flex-1 cursor-pointer py-1">Верно (True)</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                                        <RadioGroupItem value="false" id="false" />
                                        <Label htmlFor="false" className="flex-1 cursor-pointer py-1">Неверно (False)</Label>
                                    </div>
                                </>
                            )}
                        </div>
                    </RadioGroup>
                );

            case 'essay':
            case 'short_answer':
                return (
                    <Textarea
                        value={answers[currentQuestionIdx] || ""}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Введите ваш ответ..."
                        className="min-h-[120px]"
                    />
                );

            default:
                return <p className="text-amber-600">Тип вопроса "{currentQuestion.type}" пока не поддерживается в рендерере.</p>;
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Вопрос {currentQuestionIdx + 1} из {questions.length}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                        {Object.keys(answers).length} из {questions.length} отвечено
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="mb-6">
                        <h3 className="text-xl font-medium leading-relaxed text-gray-900">
                            {currentQuestion.text}
                        </h3>
                        {currentQuestion.title && currentQuestion.title !== currentQuestion.text && (
                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{currentQuestion.title}</p>
                        )}
                    </div>

                    <div className="mt-8">
                        {renderQuestionInput()}
                    </div>
                </CardContent>
            </Card>

            {showNavigation && (
                <div className="flex items-center justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={prevQuestion}
                        disabled={currentQuestionIdx === 0}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Назад
                    </Button>

                    <div className="flex gap-3">
                        {currentQuestionIdx < questions.length - 1 ? (
                            <Button onClick={nextQuestion} className="gap-2">
                                Далее
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSaving || Object.keys(answers).length < questions.length}
                                className="bg-green-600 hover:bg-green-700 gap-2"
                            >
                                {isSaving ? "Сохранение..." : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        {submitLabel}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
