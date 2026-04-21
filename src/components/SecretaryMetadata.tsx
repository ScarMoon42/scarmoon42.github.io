import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Loader2, Plus, Trash2, Building2, Briefcase } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useState, useEffect } from "react";
import * as api from "../services/api";

const API_PREFIX = import.meta.env.VITE_API_URL ? "" : "/api";

interface MetadataItem {
    id: number;
    name: string;
}

interface SecretaryMetadataProps {
    onBack: () => void;
    onLogout: () => void;
}

export function SecretaryMetadata({ onBack, onLogout }: SecretaryMetadataProps) {
    const [positions, setPositions] = useState<MetadataItem[]>([]);
    const [departments, setDepartments] = useState<MetadataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPosition, setNewPosition] = useState("");
    const [newDepartment, setNewDepartment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [posRes, depRes] = await Promise.all([
            api.get<MetadataItem[]>(`${API_PREFIX}/metadata/positions`),
            api.get<MetadataItem[]>(`${API_PREFIX}/metadata/departments`)
        ]);
        if (posRes.success) setPositions(posRes.data || []);
        if (depRes.success) setDepartments(depRes.data || []);
        setLoading(false);
    };

    const handleAddPosition = async () => {
        if (!newPosition) return;
        setSubmitting(true);
        const res = await api.post<MetadataItem>(`${API_PREFIX}/metadata/positions`, { name: newPosition });
        if (res.success) {
            setPositions(prev => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            setNewPosition("");
        }
        setSubmitting(false);
    };

    const handleDeletePosition = async (id: number) => {
        if (!confirm("Удалить эту должность?")) return;
        const res = await api.del(`${API_PREFIX}/metadata/positions/${id}`);
        if (res.success) setPositions(prev => prev.filter(p => p.id !== id));
    };

    const handleAddDepartment = async () => {
        if (!newDepartment) return;
        setSubmitting(true);
        const res = await api.post<MetadataItem>(`${API_PREFIX}/metadata/departments`, { name: newDepartment });
        if (res.success) {
            setDepartments(prev => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            setNewDepartment("");
        }
        setSubmitting(false);
    };

    const handleDeleteDepartment = async (id: number) => {
        if (!confirm("Удалить эту кафедру?")) return;
        const res = await api.del(`${API_PREFIX}/metadata/departments/${id}`);
        if (res.success) setDepartments(prev => prev.filter(d => d.id !== id));
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

                <h2 className="text-2xl mb-8">Управление справочниками</h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-12">
                        {/* Должности */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Briefcase className="h-6 w-6 text-purple-600" />
                                <h3 className="text-xl font-semibold">Должности</h3>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Новая должность..."
                                    value={newPosition}
                                    onChange={(e) => setNewPosition(e.target.value)}
                                />
                                <Button onClick={handleAddPosition} disabled={submitting}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {positions.map(pos => (
                                    <div key={pos.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                        <span>{pos.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeletePosition(pos.id)}
                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {positions.length === 0 && <p className="text-gray-400 italic">Список пуст</p>}
                            </div>
                        </div>

                        {/* Кафедры */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="h-6 w-6 text-blue-600" />
                                <h3 className="text-xl font-semibold">Кафедра / Направление</h3>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Новая кафедра..."
                                    value={newDepartment}
                                    onChange={(e) => setNewDepartment(e.target.value)}
                                />
                                <Button onClick={handleAddDepartment} disabled={submitting}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {departments.map(dep => (
                                    <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                        <span>{dep.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteDepartment(dep.id)}
                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {departments.length === 0 && <p className="text-gray-400 italic">Список пуст</p>}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
