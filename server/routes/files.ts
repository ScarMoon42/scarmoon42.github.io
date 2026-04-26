import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { parseGiftContent, validateGiftFormat } from '../lib/giftParser';
import fs from 'fs';
import path from 'path';
import { requireAuth as requireJwtAuth } from '../middleware/auth.js';

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Убедиться, что директория существует
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function attachDbUser(req: Request, res: Response, next: () => void) {
  try {
    const user = await prisma.user.findFirst({ where: { externalId: req.auth!.sub } });
    if (!user) {
      console.warn(`Profile not found for externalId: ${req.auth!.sub}`);
      return res.status(401).json({ success: false, message: 'Профиль не найден в базе данных' });
    }
    (req as Request & { authUser: typeof user }).authUser = user;
    next();
  } catch (error) {
    console.error('attachDbUser error:', error);
    return res.status(500).json({ success: false, message: 'Ошибка при проверке профиля' });
  }
}

// Сохраняем старый интерфейс роутов: requireAuth обеспечивает и JWT, и загрузку профиля из БД
const requireAuth = [requireJwtAuth, attachDbUser];

// POST /files/upload — загрузка файлов
router.post('/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      fileType: string;
      files: Array<{ name: string; content: string }>;
      comment?: string;
    };

    if (!body.fileType || !Array.isArray(body.files) || body.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Укажите fileType и массив files',
      });
    }

    const userId = (req as Request & { authUser: { id: number } }).authUser.id;
    const uploadedFiles = [];

    for (const file of body.files) {
      try {
        const buf = Buffer.from(file.content, 'base64');
        const filename = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        fs.writeFileSync(filepath, buf);

        const fileLabel =
          body.fileType === 'umk'
            ? 'УМК'
            : body.fileType === 'kp'
              ? 'КП'
              : body.fileType === 'pk'
                ? 'ПК (повышение квалификации)'
                : body.fileType;

        const dbFile = await prisma.file.create({
          data: {
            name: file.name,
            path: `/uploads/${filename}`,
            comment: fileLabel,
            status: 'uploaded',
            userId,
          },
        });

        uploadedFiles.push({
          id: dbFile.id,
          name: dbFile.name,
          path: dbFile.path,
          uploadedAt: dbFile.createdAt.toISOString(),
        });
      } catch (fileError) {
        console.error('Error uploading file', fileError);
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Не удалось загрузить файлы',
      });
    }

    return res.json({
      success: true,
      data: {
        count: uploadedFiles.length,
        files: uploadedFiles,
      },
    });
  } catch (error) {
    console.error('File upload error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке файлов',
    });
  }
});

// GET /files/by-user/:userId — список файлов пользователя (для эксперта — файлы кандидата)
router.get('/by-user/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = (req as Request & { authUser: { role: string } }).authUser;
    const isExpert = authUser.role === 'Эксперт' || authUser.role === 'Внешний эксперт';
    if (!isExpert) {
      return res.status(403).json({ success: false, message: 'Доступ только для экспертов' });
    }

    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Некорректный id пользователя' });
    }

    const files = await prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: files.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.comment,
        status: f.status,
        expertComment: f.expertComment,
        uploadedAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Files by user error', error);
    return res.status(500).json({ success: false, message: 'Ошибка при получении файлов' });
  }
});

// GET /files — список файлов текущего пользователя
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { authUser: { id: number } }).authUser.id;
    const files = await prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: files.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.comment, // УМК, ПК, и т.д.
        status: f.status,
        expertComment: f.expertComment,
        uploadedAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Files list error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка файлов',
    });
  }
});

// GET /files/:id/download — скачать файл (преподаватель: свои файлы, эксперт: файлы кандидатов)
router.get('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (Number.isNaN(fileId)) {
      return res.status(400).json({ success: false, message: 'Некорректный id файла' });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { user: { select: { id: true } } },
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Файл не найден' });
    }

    const authUser = (req as Request & { authUser: { id: number; role: string } }).authUser;
    const isOwner = file.userId === authUser.id;
    const isExpert = authUser.role === 'Эксперт' || authUser.role === 'Внешний эксперт';
    const canAccess = isOwner || isExpert;

    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Нет доступа к файлу' });
    }

    const filepath = path.join(UPLOAD_DIR, path.basename(file.path));
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Файл не найден на диске' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.sendFile(path.resolve(filepath));
  } catch (error) {
    console.error('File download error', error);
    return res.status(500).json({ success: false, message: 'Ошибка при скачивании' });
  }
});

// GET /files/:id — информация о файле
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (Number.isNaN(fileId)) {
      return res.status(400).json({ success: false, message: 'Некорректный id файла' });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    const userId = (req as Request & { authUser: { id: number } }).authUser.id;
    if (!file || file.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Файл не найден' });
    }

    return res.json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.comment,
        status: file.status,
        uploadedAt: file.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('File get error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении информации о файле',
    });
  }
});

// DELETE /files/:id — удаление файла
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (Number.isNaN(fileId)) {
      return res.status(400).json({ success: false, message: 'Некорректный id файла' });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    const userId = (req as Request & { authUser: { id: number } }).authUser.id;
    if (!file || file.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Файл не найден' });
    }

    // Удаляем физический файл
    const filepath = path.join(UPLOAD_DIR, path.basename(file.path));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Удаляем из БД
    await prisma.file.delete({
      where: { id: fileId },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('File delete error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при удалении файла',
    });
  }
});

// ========== GIFT ФОРМАТ ==========

/** POST /files/gift/form/upload — загрузить GIFT ресурс (тест или анкету) */
router.post(
  '/gift/form/upload',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        name: string;
        description?: string;
        giftContent: string;
        formType: 'student_open_lesson' | 'expert_open_lesson' | 'expert_file_eval' | 'teacher_test';
      };

      if (!body.name || !body.giftContent || !body.formType) {
        return res.status(400).json({
          success: false,
          message: 'Укажите name, giftContent и formType',
        });
      }

      const validTypes = ['student_open_lesson', 'expert_open_lesson', 'expert_file_eval', 'teacher_test'];
      if (!validTypes.includes(body.formType)) {
        return res.status(400).json({
          success: false,
          message: `formType должен быть одним из: ${validTypes.join(', ')}`,
        });
      }

      // Валидация GIFT формата
      const validation = validateGiftFormat(body.giftContent);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Некорректный GIFT формат',
          errors: validation.errors,
        });
      }

      // Парсим контент
      const parsedData = parseGiftContent(body.giftContent);

      const authUser = (req as Request & { authUser: { id: number; role: string } }).authUser;
      if (authUser.role !== 'Секретарь') {
        return res.status(403).json({ success: false, message: 'Доступ только для секретаря' });
      }
      const userId = authUser.id;
      const form = await prisma.formFiles.create({
        data: {
          name: body.name,
          description: body.description,
          file: body.name,
          parsedData: JSON.stringify(parsedData),
          formType: body.formType,
          uploadedBy: userId,
        },
      });

      return res.json({
        success: true,
        data: {
          id: form.id,
          name: form.name ?? form.file,
          formType: form.formType,
          questionCount: parsedData.questionCount,
          createdAt: form.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('GIFT form upload error', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при загрузке GIFT формы',
      });
    }
  }
);

/** GET /files/gift/test/:id — получить тест */
router.get('/gift/test/:id', requireAuth, async (req: Request, res: Response) => {
  // Alias for getting form by ID
  return res.redirect(`/files/gift/form/${req.params.id}`);
});

/** GET /files/gift/forms/student — получить последнюю анкету для студентов (публично) */
router.get('/gift/forms/student', async (_req: Request, res: Response) => {
  try {
    const form = await prisma.formFiles.findFirst({
      where: { formType: 'student_open_lesson' },
      orderBy: { createdAt: 'desc' },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: 'Анкета для студентов не найдена' });
    }

    return res.json({
      success: true,
      data: {
        id: form.id,
        name: form.name,
        parsedData: JSON.parse(form.parsedData || '{}'),
      },
    });
  } catch (error) {
    console.error('Public student form error', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Сделаем получение формы по ID публичным, так как студенты обращаются к нему через QR
const publicFormGet = async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id, 10);
    if (Number.isNaN(formId)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }

    const form = await prisma.formFiles.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: 'Форма не найдена' });
    }

    return res.json({
      success: true,
      data: {
        id: form.id,
        name: form.name,
        description: form.description,
        formType: form.formType,
        file: form.file,
        parsedData: form.parsedData ? JSON.parse(form.parsedData) : null,
        uploadedBy: form.uploadedBy,
        createdAt: form.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Public GIFT form get error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении формы',
    });
  }
};

router.get('/gift/form/public/:id', publicFormGet);
// Для обратной совместимости сделаем обертку над обычным маршрутом
router.get('/gift/form/:id', (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization) {
    // Если есть токен — идем через requireAuth
    return next();
  } else {
    // Публичный доступ
    return publicFormGet(req, res);
  }
}, requireAuth, publicFormGet);

/** GET /files/gift/tests — список тестов */
router.get('/gift/tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const tests = await prisma.formFiles.findMany({
      where: { formType: 'teacher_test' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        file: true,
        description: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: tests.map((t: any) => ({
        id: t.id,
        name: t.name ?? t.file,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('GIFT tests list error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка тестов',
    });
  }
});

/** GET /files/gift/forms — список форм */
router.get('/gift/forms', requireAuth, async (req: Request, res: Response) => {
  try {
    const forms = await prisma.formFiles.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        file: true,
        description: true,
        formType: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      data: forms.map((f: any) => ({
        id: f.id,
        name: f.name ?? f.file,
        description: f.description,
        formType: f.formType,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('GIFT forms list error', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка форм',
    });
  }
});

/** Универсальная логика сохранения результата GIFT ресурса */
async function handleGiftSubmit(req: Request, res: Response) {
  try {
    const { formId, teacherId, answers } = req.body as {
      formId: number;
      teacherId?: number;
      answers: Record<string, any>
    };
    const authUser = (req as any).authUser;

    if (!formId || !answers) {
      return res.status(400).json({ success: false, message: 'Укажите formId и ответы' });
    }

    const form = await prisma.formFiles.findUnique({ where: { id: formId } });
    if (!form) return res.status(404).json({ success: false, message: 'Форма не найдена' });

    if (form.formType === 'teacher_test') {
      await prisma.resultTestTeacher.upsert({
        where: {
          teacherId_testId: {
            teacherId: authUser.id,
            testId: formId
          }
        },
        update: { result: JSON.stringify(answers) },
        create: {
          teacherId: authUser.id,
          testId: formId,
          result: JSON.stringify(answers)
        }
      });
    } else if (form.formType === 'expert_file_eval' || form.formType === 'expert_open_lesson') {
      const tid = teacherId || (req.body as any).teacherId;
      if (!tid) return res.status(400).json({ success: false, message: 'Укажите teacherId для экспертной анкеты' });

      await prisma.resultFiles.create({
        data: {
          idExpert: authUser.id,
          teacherId: parseInt(String(tid), 10),
          formId,
          result: JSON.stringify(answers)
        }
      });
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('GIFT submit error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера при сохранении результата' });
  }
}

/** POST /files/gift/submit — отправить результаты любого ресурса (GIFT) */
router.post('/gift/submit', requireAuth, handleGiftSubmit);

/** DELETE /files/gift/form/:id — удалить GIFT ресурс */
router.delete('/gift/form/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const formId = parseInt(req.params.id, 10);
    if (Number.isNaN(formId)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }

    const form = await prisma.formFiles.findUnique({ where: { id: formId } });
    const authUser = (req as Request & { authUser: { id: number; role: string } }).authUser;

    if (!form || (form.uploadedBy !== authUser.id && authUser.role !== 'Секретарь')) {
      return res.status(404).json({ success: false, message: 'Форма не найдена или нет прав' });
    }

    await prisma.formFiles.delete({ where: { id: formId } });
    return res.json({ success: true });
  } catch (error) {
    console.error('GIFT delete error', error);
    return res.status(500).json({ success: false, message: 'Ошибка при удалении' });
  }
});

/** POST /files/gift/resource/:id/submit — универсальный эндпоинт для результатов (алиас) */
router.post('/gift/resource/:id/submit', requireAuth, async (req: Request, res: Response) => {
  const { answers, teacherId } = req.body;
  const formId = parseInt(req.params.id, 10);
  req.body = { formId, teacherId, answers };
  return handleGiftSubmit(req, res);
});

/** POST /files/result-files — сохранить результаты анкеты по файлам (эксперт) */
router.post('/result-files', requireAuth, async (req: Request, res: Response) => {
  try {
    const { teacherId, formId, result } = req.body as { teacherId: number; formId: number; result: Record<string, any> };
    const authUser = (req as any).authUser;
    if (!teacherId || !formId || !result) return res.status(400).json({ success: false, message: 'Не все поля заполнены' });

    await prisma.resultFiles.create({
      data: {
        idExpert: authUser.id,
        teacherId,
        formId,
        result: JSON.stringify(result)
      }
    });

    return res.json({ success: true });
  } catch (e) {
    console.error('Result files create error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// ========== ОЦЕНКА ФАЙЛОВ ==========

router.patch('/:id/evaluate', requireAuth, async (req: Request, res: Response) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const authUser = (req as any).authUser as { role: string };
    if (authUser.role !== 'Эксперт' && authUser.role !== 'Внешний эксперт') return res.status(403).json({ success: false, message: 'Доступ только для экспертов' });

    const { status, expertComment } = req.body as { status: string; expertComment?: string };
    if (!status) return res.status(400).json({ success: false, message: 'Укажите статус' });

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { status, expertComment: expertComment ?? null },
    });

    return res.json({ success: true, data: updatedFile });
  } catch (error) {
    console.error('File evaluate error', error);
    return res.status(500).json({ success: false, message: 'Ошибка при оценке файла' });
  }
});

export default router;
