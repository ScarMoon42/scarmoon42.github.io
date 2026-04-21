import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Clock } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { fetchUsers, createUser, updateUser, deleteUser, extendUserExpiration, type ApiUser } from "../services/users";
import { getStoredUser } from "../services/auth";
import * as api from "../services/api";

type UserRole = "Преподаватель" | "Эксперт" | "Внешний эксперт" | "Секретарь";

interface User {
  id: string;
  name: string;
  login: string;
  role: UserRole;
  isTemporary: boolean;
  expirationDate?: string;
  positions?: string;
  department?: string;
}

function apiUserToUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    login: u.login,
    role: u.role as UserRole,
    isTemporary: !!u.isTemporary,
    expirationDate: u.expirationDate,
    positions: u.positions,
    department: u.department,
  };
}

interface SecretaryUserListProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SecretaryUserList({ onBack, onLogout }: SecretaryUserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [selectedUserForExtend, setSelectedUserForExtend] = useState<User | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "" as UserRole,
    position: "",
    department: "",
  });
  const [newUser, setNewUser] = useState({
    name: "",
    login: "",
    password: "",
    role: "" as UserRole | "",
    isTemporary: false,
    expirationDate: "",
    position: "",
    department: "",
  });

  const [metadata, setMetadata] = useState<{ positions: { name: string }[], departments: { name: string }[] }>({ positions: [], departments: [] });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setListError("");
    const [result, posRes, depRes] = await Promise.all([
      fetchUsers(),
      api.get<{ name: string }[]>(`${import.meta.env.VITE_API_URL || "/api"}/metadata/positions`),
      api.get<{ name: string }[]>(`${import.meta.env.VITE_API_URL || "/api"}/metadata/departments`)
    ]);

    if (result.success) setUsers(result.data.map(apiUserToUser));
    else setListError(result.error);

    if (posRes.success && depRes.success) {
      setMetadata({ positions: posRes.data || [], departments: depRes.data || [] });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Получить текущего пользователя
    const user = getStoredUser();
    if (user) setCurrentUserId(String(user.id));
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.login || !newUser.password || !newUser.role) {
      alert("Пожалуйста, заполните все поля");
      return;
    }
    if (newUser.login.length < 3) {
      alert("Логин должен содержать минимум 3 символа");
      return;
    }
    if (newUser.isTemporary && !newUser.expirationDate) {
      alert("Пожалуйста, укажите дату удаления для временного аккаунта");
      return;
    }
    setSubmitLoading(true);
    const result = await createUser({
      fullName: newUser.name,
      login: newUser.login,
      password: newUser.password,
      role: newUser.role,
      isTemporary: newUser.isTemporary || undefined,
      expirationDate: newUser.isTemporary ? newUser.expirationDate : undefined,
      positions: newUser.role === "Преподаватель" ? newUser.position : undefined,
      department: newUser.role === "Преподаватель" ? newUser.department : undefined,
    });
    setSubmitLoading(false);
    if (!result.success) {
      alert(result.error ?? "Ошибка создания");
      return;
    }
    setUsers((prev) => [...prev, apiUserToUser(result.data!)]);
    setNewUser({ name: "", login: "", password: "", role: "", isTemporary: false, expirationDate: "", position: "", department: "" });
    setIsDialogOpen(false);
    alert(`Пользователь создан!\nЛогин: ${newUser.login}\nПароль: ${newUser.password}`);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUserId) {
      alert("Вы не можете удалить собственный аккаунт");
      return;
    }
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return;
    const result = await deleteUser(id);
    if (result.success) setUsers((prev) => prev.filter((u) => u.id !== id));
    else alert(result.error ?? "Ошибка удаления");
  };

  const handleExtendExpiration = async () => {
    if (!selectedUserForExtend || !extendDate) {
      alert("Пожалуйста, выберите дату");
      return;
    }
    setExtendLoading(true);
    const result = await extendUserExpiration(selectedUserForExtend.id, extendDate);
    setExtendLoading(false);
    if (!result.success) {
      alert(result.error ?? "Ошибка продления срока");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUserForExtend.id
          ? { ...u, expirationDate: result.data?.expirationDate }
          : u
      )
    );
    setExtendDialogOpen(false);
    setSelectedUserForExtend(null);
    setExtendDate("");
    alert("Срок действия продлен");
  };

  const openExtendDialog = (user: User) => {
    setSelectedUserForExtend(user);
    setExtendDate(user.expirationDate || "");
    setExtendDialogOpen(true);
  };


  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      position: user.positions || "",
      department: user.department || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSubmitLoading(true);
    const result = await updateUser(editingUser.id, {
      fullName: editForm.name,
      role: editForm.role,
      positions: editForm.role === "Преподаватель" ? editForm.position : undefined,
      department: editForm.role === "Преподаватель" ? editForm.department : undefined,
    });
    setSubmitLoading(false);
    if (!result.success) {
      alert(result.error ?? "Ошибка сохранения");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? apiUserToUser(result.data!) : u))
    );
    setIsEditOpen(false);
    alert("Пользователь обновлен");
  };

  const handleNewUserRoleChange = (role: string) => {
    setNewUser({
      ...newUser,
      role: role as UserRole,
      isTemporary: role === "Преподаватель" || role === "Внешний эксперт",
    });
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

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">Список</h2>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить пользователя
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Создание нового пользователя</DialogTitle>
                <DialogDescription>Введите данные нового пользователя</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ФИО</Label>
                  <Input
                    id="name"
                    placeholder="Иванов Иван Иванович"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login">Логин</Label>
                  <Input
                    id="login"
                    placeholder="ivan_ivanov"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="text"
                    placeholder="Введите пароль"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Роль</Label>
                  <Select value={newUser.role} onValueChange={handleNewUserRoleChange}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Эксперт">Эксперт</SelectItem>
                      <SelectItem value="Преподаватель">Претендент ППС</SelectItem>
                      <SelectItem value="Внешний эксперт">Внешний эксперт</SelectItem>
                      <SelectItem value="Секретарь">Секретарь</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newUser.role === "Преподаватель" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="position">Должность</Label>
                      <Select value={newUser.position} onValueChange={(val) => setNewUser(prev => ({ ...prev, position: val }))}>
                        <SelectTrigger id="position">
                          <SelectValue placeholder="Выберите должность" />
                        </SelectTrigger>
                        <SelectContent>
                          {metadata.positions.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Кафедра</Label>
                      <Select value={newUser.department} onValueChange={(val) => setNewUser(prev => ({ ...prev, department: val }))}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Выберите кафедру" />
                        </SelectTrigger>
                        <SelectContent>
                          {metadata.departments.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {(newUser.role === "Преподаватель" || newUser.role === "Внешний эксперт") && (
                  <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-lg">
                    <Checkbox
                      id="temporary"
                      checked={newUser.isTemporary}
                      onCheckedChange={(checked) =>
                        setNewUser({ ...newUser, isTemporary: checked as boolean })
                      }
                    />
                    <Label htmlFor="temporary" className="text-sm cursor-pointer">
                      Временный аккаунт (будет автоматически удален после завершения процесса)
                    </Label>
                  </div>
                )}

                {newUser.isTemporary && (
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Дата удаления</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={newUser.expirationDate}
                      onChange={(e) => setNewUser({ ...newUser, expirationDate: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleAddUser} disabled={submitLoading}>
                    {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Создать"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Продление срока действия</DialogTitle>
                <DialogDescription>
                  Продлить срок для: {selectedUserForExtend?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="extendDate">Новая дата удаления (выполнения до)</Label>
                  <Input
                    id="extendDate"
                    type="date"
                    value={extendDate}
                    onChange={(e) => setExtendDate(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleExtendExpiration} disabled={extendLoading}>
                    {extendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Продлить"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Редактирование пользователя</DialogTitle>
                <DialogDescription>Измените данные пользователя</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">ФИО</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Роль</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(val) => setEditForm({ ...editForm, role: val as UserRole })}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Эксперт">Эксперт</SelectItem>
                      <SelectItem value="Преподаватель">Претендент ППС</SelectItem>
                      <SelectItem value="Внешний эксперт">Внешний эксперт</SelectItem>
                      <SelectItem value="Секретарь">Секретарь</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editForm.role === "Преподаватель" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-position">Должность</Label>
                      <Select
                        value={editForm.position}
                        onValueChange={(val) => setEditForm(prev => ({ ...prev, position: val }))}
                      >
                        <SelectTrigger id="edit-position">
                          <SelectValue placeholder="Выберите должность" />
                        </SelectTrigger>
                        <SelectContent>
                          {metadata.positions.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Кафедра</Label>
                      <Select
                        value={editForm.department}
                        onValueChange={(val) => setEditForm(prev => ({ ...prev, department: val }))}
                      >
                        <SelectTrigger id="edit-department">
                          <SelectValue placeholder="Выберите кафедру" />
                        </SelectTrigger>
                        <SelectContent>
                          {metadata.departments.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleEditSave} disabled={submitLoading}>
                    {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-gray-600 mb-6">
          Уважаемый секретарь! Просим Вас распределить роли участникам.
        </p>

        {listError && (
          <p className="text-red-600 mb-4">{listError}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2">
                    <tr>
                      <th className="px-6 py-4 text-left">ФИО</th>
                      <th className="px-6 py-4 text-left">Логин</th>
                      <th className="px-6 py-4 text-left">Роль</th>
                      <th className="px-6 py-4 text-left">Статус</th>
                      <th className="px-6 py-4 text-center">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4">{user.name}</td>
                        <td className="px-6 py-4 text-gray-600">{user.login}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.role}</span>
                            {user.positions && <span className="text-xs text-gray-500">{user.positions}</span>}
                            {user.department && <span className="text-xs text-gray-400">{user.department}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.isTemporary && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                              Временный
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center flex gap-2 justify-center">
                          {user.isTemporary && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExtendDialog(user)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                            >
                              <Clock className="h-4 w-4" />
                              Продлить
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Редактировать"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUserId}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={user.id === currentUserId ? "Невозможно удалить свой аккаунт" : "Удалить пользователя"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && users.length === 0 && !listError && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Список пользователей пуст. Добавьте первого пользователя.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}