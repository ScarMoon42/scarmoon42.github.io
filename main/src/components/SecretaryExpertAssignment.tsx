import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowLeft, Loader2, Link as LinkIcon, Trash2 } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useState, useEffect } from "react";
import * as api from "../services/api";
import { fetchUsers, type ApiUser } from "../services/users";

const API_PREFIX = import.meta.env.VITE_API_URL ? "" : "/api";

interface Assignment {
    id: number;
    teacher: { id: number; fullName: string };
    expert: { id: number; fullName: string };
    createdAt: string;
}

interface SecretaryExpertAssignmentProps {
    onBack: () => void;
    onLogout: () => void;
}

export function SecretaryExpertAssignment({ onBack, onLogout }: SecretaryExpertAssignmentProps) {
    const [teachers, setTeachers] = useState<ApiUser[]>([]);
    const [experts, setExperts] = useState<ApiUser[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [selectedExpert, setSelectedExpert] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [usersRes, assignRes] = await Promise.all([
            fetchUsers(),
            api.get<Assignment[]>(`${API_PREFIX}/assignments`)
        ]);

        if (usersRes.success) {
            setTeachers(usersRes.data.filter(u => u.role === "Преподаватель"));
            setExperts(usersRes.data.filter(u => u.role === "Эксперт" || u.role === "Внешний эксперт"));
        }
        if (assignRes.success) setAssignments(assignRes.data || []);
        setLoading(false);
    };

    const handleCreateAssignment = async () => {
        if (!selectedTeacher || !selectedExpert) return;
        setSubmitting(true);
        const res = await api.post<Assignment>(`${API_PREFIX}/assignments`, {
            teacherId: selectedTeacher,
            expertId: selectedExpert
        });
        if (res.success) {
            setAssignments(prev => [res.data!, ...prev]);
            setSelectedTeacher("");
            setSelectedExpert("");
        } else {
            alert(res.error || "Ошибка создания назначения");
        }
        setSubmitting(false);
    };

    const handleDeleteAssignment = async (id: number) => {
        if (!confirm("Удалить это назначение?")) return;
        const res = await api.del(`${API_PREFIX}/assignments/${id}`);
        if (res.success) setAssignments(prev => prev.filter(a => a.id !== id));
    };

    return (
        <div className="min-h-screen bg-white">
            <TeacherNavigation showLogout onLogout={onLogout} />

            <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <Button variant="ghost" onClick={onBack} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                </Button>

                <div className="mb-8">
                    <p className="text-sm text-gray-600">Роль</p>
                    <p className="text-xl">Секретарь</p>
                </div>

                <h2 className="text-2xl mb-8">Закрепление преподавателей за экспертами</h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-8">
                        {/* Форма */}
                        <Card className="col-span-1 border-2 h-fit">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Преподаватель</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={selectedTeacher}
                                            onChange={(e) => setSelectedTeacher(e.target.value)}
                                        >
                                            <option value="">Выберите...</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Эксперт</label>
                                        <select
                                            className="w-full p-2 border rounded-md"
                                            value={selectedExpert}
                                            onChange={(e) => setSelectedExpert(e.target.value)}
                                        >
                                            <option value="">Выберите...</option>
                                            {experts.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Button className="w-full gap-2" onClick={handleCreateAssignment} disabled={submitting}>
                                    <LinkIcon className="h-4 w-4" />
                                    Закрепить
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Список */}
                        <div className="col-span-2 space-y-4">
                            <h3 className="text-lg font-medium">Текущие назначения</h3>
                            {assignments.map(a => (
                                <Card key={a.id} className="border-2 hover:border-purple-200 transition-colors">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Преподаватель</p>
                                                <p className="font-medium">{a.teacher.fullName}</p>
                                            </div>
                                            <div className="text-gray-300">⟶</div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Эксперт</p>
                                                <p className="font-medium">{a.expert.fullName}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAssignment(a.id)} className="text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {assignments.length === 0 && <p className="text-gray-400 italic text-center py-8">Назначений пока нет</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
