import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Download, FileText, Loader2 } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { uploadFiles, getFiles, downloadFile } from "../services/files";
import { FileItem } from "../services/files";

interface UploadUMKProps {
  onBack: () => void;
  onLogout: () => void;
}

export function UploadUMK({ onBack, onLogout }: UploadUMKProps) {
  const [umkFiles, setUmkFiles] = useState<File[]>([]);
  const [pkFiles, setPkFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const umkFileInputRef = useRef<HTMLInputElement>(null);
  const pkFileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    const result = await getFiles();
    if (result.success) {
      setUploadedFiles(result.files);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- загрузка при монтировании
  }, []);

  // Обработка выбора файлов
  const handleUmkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUmkFiles([...umkFiles, ...files]);
    if (e.target) e.target.value = '';
  };

  const handlePkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPkFiles([...pkFiles, ...files]);
    if (e.target) e.target.value = '';
  };

  // Drag and drop для UMK
  const handleUmkDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-400');
  };

  const handleUmkDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-purple-400');
  };

  const handleUmkDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-400');
    const files = Array.from(e.dataTransfer.files);
    setUmkFiles([...umkFiles, ...files]);
  };

  // Drag and drop для PK
  const handlePkDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-400');
  };

  const handlePkDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-purple-400');
  };

  const handlePkDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-400');
    const files = Array.from(e.dataTransfer.files);
    setPkFiles([...pkFiles, ...files]);
  };

  // Удаление выбранного файла
  const removeUmkFile = (index: number) => {
    setUmkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePkFile = (index: number) => {
    setPkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Загрузка файлов на сервер
  const handleUpload = async () => {
    if (umkFiles.length === 0 && pkFiles.length === 0) {
      setError("Выберите файлы для загрузки");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Загружаем УМК файлы
      if (umkFiles.length > 0) {
        const umkResult = await uploadFiles("umk", umkFiles);
        if (!umkResult.success) {
          setError(umkResult.error);
          setLoading(false);
          return;
        }
      }

      // Загружаем ПК файлы
      if (pkFiles.length > 0) {
        const pkResult = await uploadFiles("pk", pkFiles);
        if (!pkResult.success) {
          setError(pkResult.error);
          setLoading(false);
          return;
        }
      }

      setMessage(
        `Успешно загружено ${(umkFiles.length || 0) + (pkFiles.length || 0)} файлов`
      );
      setUmkFiles([]);
      setPkFiles([]);

      // Обновляем список загруженных файлов
      await loadFiles();

      // Очищаем сообщение через 3 секунды
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
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

        <h2 className="text-2xl mb-6">
          Загрузка учебно-методического комплекса (УМК) и курсовых проектов (КП)
        </h2>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </CardContent>
          </Card>
        )}

        {message && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{message}</span>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Загрузка файлов УМК</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onDragOver={handleUmkDragOver}
                onDragLeave={handleUmkDragLeave}
                onDrop={handleUmkDrop}
                onClick={() => umkFileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg mb-2">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-sm text-gray-500">
                  Поддерживаемые форматы: PDF, DOC, DOCX, PPT, PPTX
                </p>
              </div>
              <input
                ref={umkFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleUmkFileSelect}
                className="hidden"
              />

              {umkFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {umkFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-blue-50 p-3 rounded border border-blue-200"
                    >
                      <span className="text-sm text-blue-900">{file.name}</span>
                      <button
                        onClick={() => removeUmkFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Загрузка курсовых проектов (КП)</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onDragOver={handlePkDragOver}
                onDragLeave={handlePkDragLeave}
                onDrop={handlePkDrop}
                onClick={() => pkFileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg mb-2">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-sm text-gray-500">
                  Поддерживаемые форматы: PDF, DOC, DOCX
                </p>
              </div>
              <input
                ref={pkFileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handlePkFileSelect}
                className="hidden"
              />

              {pkFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {pkFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-blue-50 p-3 rounded border border-blue-200"
                    >
                      <span className="text-sm text-blue-900">{file.name}</span>
                      <button
                        onClick={() => removePkFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Загруженные файлы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-gray-50 rounded-xl border-2 border-gray-100 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 leading-none mb-1">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.type} • {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${file.status === "Принято"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : file.status === "Требует доработки"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}
                          >
                            {file.status === "uploaded" ? "Загружен" : file.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={async () => {
                              setDownloadingId(file.id);
                              try {
                                await downloadFile(file.id, file.name);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Ошибка");
                              } finally {
                                setDownloadingId(null);
                              }
                            }}
                            disabled={downloadingId === file.id}
                          >
                            {downloadingId === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                              <Download className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {file.expertComment && (
                        <div className="p-4 bg-purple-50 flex gap-3 border-t border-purple-100">
                          <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">
                              Комментарий эксперта:
                            </p>
                            <p className="text-sm text-purple-800 leading-relaxed">
                              {file.expertComment}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onBack}>
              Отмена
            </Button>
            <Button
              onClick={handleUpload}
              disabled={loading || (umkFiles.length === 0 && pkFiles.length === 0)}
            >
              {loading ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
