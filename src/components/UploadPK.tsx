import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import { TeacherNavigation } from "./TeacherNavigation";
import { uploadFiles, getFiles, downloadFile } from "../services/files";
import { FileItem } from "../services/files";

interface UploadPKProps {
  onBack: () => void;
  onLogout: () => void;
}

export function UploadPK({ onBack, onLogout }: UploadPKProps) {
  const [pkFiles, setPkFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pkFileInputRef = useRef<HTMLInputElement>(null);

  // Загрузить список файлов при монтировании
  const loadFiles = async () => {
    const result = await getFiles();
    if (result.success) {
      setUploadedFiles(result.files.filter((f) => f.type?.includes("ПК")));
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- загрузка при монтировании
  }, []);

  // Обработка выбора файлов
  const handlePkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPkFiles([...pkFiles, ...files]);
    if (e.target) e.target.value = '';
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-400');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-purple-400');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-400');
    const files = Array.from(e.dataTransfer.files);
    setPkFiles([...pkFiles, ...files]);
  };

  // Удаление выбранного файла
  const removeFile = (index: number) => {
    setPkFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Загрузка файлов на сервер
  const handleUpload = async () => {
    if (pkFiles.length === 0) {
      setError("Выберите файлы для загрузки");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadFiles("pk", pkFiles);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setMessage(`Успешно загружено ${result.count} файлов`);
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
          Загрузка документов о повышении квалификации (ПК)
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
              <CardTitle>Загрузка сертификатов и удостоверений</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => pkFileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg mb-2">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-sm text-gray-500">
                  Поддерживаемые форматы: PDF, JPG, PNG
                </p>
              </div>
              <input
                ref={pkFileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handlePkFileSelect}
                className="hidden"
              />

              <p className="text-sm text-gray-600 mt-4">
                Загрузите сканы или фотографии документов о повышении квалификации,
                сертификаты о прохождении курсов и других образовательных программ.
              </p>

              {pkFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {pkFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-blue-50 p-3 rounded border border-blue-200"
                    >
                      <span className="text-sm text-blue-900">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
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
                      className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.type} • {new Date(file.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            file.status === "uploaded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {file.status === "uploaded" ? "Загружен" : file.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
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
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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
            <Button onClick={handleUpload} disabled={loading || pkFiles.length === 0}>
              {loading ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
