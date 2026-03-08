import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { TeacherNavigation } from "./TeacherNavigation";
import * as api from "../services/api";

const API_PREFIX = import.meta.env.VITE_API_URL ? "" : "/api";

interface RoleSelectionProps {
  onComplete: (position: string, department: string) => void;
  onLogout: () => void;
}

export function RoleSelection({ onComplete, onLogout }: RoleSelectionProps) {
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [metadata, setMetadata] = useState<{ positions: { name: string }[], departments: { name: string }[] }>({ positions: [], departments: [] });

  useEffect(() => {
    const load = async () => {
      const [posRes, depRes] = await Promise.all([
        api.get<{ name: string }[]>(`${API_PREFIX}/metadata/positions`),
        api.get<{ name: string }[]>(`${API_PREFIX}/metadata/departments`)
      ]);
      if (posRes.success && depRes.success) {
        setMetadata({ positions: posRes.data || [], departments: depRes.data || [] });
      }
    };
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (position && department) {
      onComplete(position, department);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavigation showLogout onLogout={onLogout} />

      <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div>
              <p className="text-sm text-gray-600">Роль</p>
              <div className="flex items-center gap-2">
                <p className="text-xl">Преподаватель</p>
                <UserCircle className="h-8 w-8" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl mb-8">Просим Вас указать:</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="position" className="text-xl">
                вакантную должность
              </Label>
              <div className="flex items-center gap-4">
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger
                    id="position"
                    className="flex-1 h-14 bg-purple-50 border-purple-200"
                  >
                    <SelectValue placeholder="Выберите должность" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.positions.map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="department" className="text-xl">
                по кафедре
              </Label>
              <div className="flex items-center gap-4">
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger
                    id="department"
                    className="flex-1 h-14 bg-purple-50 border-purple-200"
                  >
                    <SelectValue placeholder="Выберите кафедру" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata.departments.map(d => (
                      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                className="px-8"
                disabled={!position || !department}
              >
                Продолжить
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}