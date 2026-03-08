import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, ClipboardList, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import * as api from '../services/api';

interface SecretaryUploadProps {
  onBack: () => void;
}

interface GiftItem {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  formType?: string;
}

type GiftType = 'student_open_lesson' | 'expert_open_lesson' | 'expert_file_eval' | 'teacher_test';

export function SecretaryUpload({ onBack }: SecretaryUploadProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [giftContent, setGiftContent] = useState('');
  const [formType, setFormType] = useState<GiftType>('student_open_lesson');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [resources, setResources] = useState<GiftItem[]>([]);

  const loadData = async () => {
    setFetching(true);
    const res = await api.get('/files/gift/forms');
    if (res.success && (res.data as any).data) {
      setResources((res.data as any).data);
    }
    setFetching(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const uploadResource = async () => {
    setLoading(true);
    setMessage(null);
    const res = await api.post('/files/gift/form/upload', { name, description, giftContent, formType });
    setLoading(false);
    if (!res.success) {
      setMessage({ text: res.error ?? 'Ошибка при загрузке ресурса', type: 'error' });
    } else {
      setMessage({ text: 'Ресурс успешно загружен', type: 'success' });
      setName('');
      setDescription('');
      setGiftContent('');
      loadData();
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот ресурс?')) return;

    const res = await api.del(`/files/gift/form/${id}`);
    if (res.success) {
      loadData();
    } else {
      alert('Ошибка при удалении: ' + res.error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'student_open_lesson': return 'Студенты (Открытое занятие)';
      case 'expert_open_lesson': return 'Эксперты (Открытое занятие)';
      case 'expert_file_eval': return 'Эксперты (Оценка файлов)';
      case 'teacher_test': return 'Тест преподавателя';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">GIFT Ресурсы</h2>
            <p className="text-gray-500 text-sm">Управление тестами и анкетами в едином формате</p>
          </div>
          <Button variant="outline" onClick={onBack}>Назад</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-2">
              <CardHeader className="bg-white border-b">
                <CardTitle className="text-lg">Загрузить ресурс</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Название</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Напр., Анкета эксперта (Файлы)"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Описание</label>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Дополнительная информация"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Категория</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    >
                      <option value="student_open_lesson">Анкета студента (Открытое занятие)</option>
                      <option value="expert_open_lesson">Анкета эксперта (Открытое занятие)</option>
                      <option value="expert_file_eval">Анкета эксперта (Оценка файлов)</option>
                      <option value="teacher_test">Тест для преподавателя</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Содержимое (GIFT)</label>
                    <textarea
                      value={giftContent}
                      onChange={(e) => setGiftContent(e.target.value)}
                      rows={10}
                      placeholder="// Введите вопросы..."
                      className="w-full border border-gray-300 rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                    />
                  </div>

                  {message && (
                    <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {message.text}
                    </div>
                  )}

                  <Button
                    onClick={uploadResource}
                    disabled={loading || !name || !giftContent}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Загрузить"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-2 shadow-sm min-h-[500px]">
              <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  Список ресурсов
                </CardTitle>
                <div className="text-xs text-gray-400 font-medium">
                  Всего: {resources.length}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {fetching ? (
                  <div className="p-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-200" />
                    <p className="text-gray-400 mt-4">Загрузка данных...</p>
                  </div>
                ) : resources.length === 0 ? (
                  <div className="p-20 text-center text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    Ресурсы не найдены
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {resources.map((resource) => (
                      <div key={resource.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 truncate">{resource.name}</h4>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${resource.formType === 'teacher_test' ? 'bg-indigo-100 text-indigo-700' :
                                resource.formType?.includes('expert') ? 'bg-amber-100 text-amber-700' :
                                  'bg-sky-100 text-sky-700'
                              }`}>
                              {getTypeLabel(resource.formType || '')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">{resource.description || "Нет описания"}</p>
                          <div className="mt-2 text-[10px] text-gray-400 font-medium flex gap-3">
                            <span>ID: {resource.id}</span>
                            <span>{new Date(resource.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => deleteItem(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
