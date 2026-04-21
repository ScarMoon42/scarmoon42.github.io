import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth as requireJwtAuth } from '../middleware/auth.js';

const router = Router();

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).split('-').reverse().join('.');
}

async function attachDbUser(req: Request, res: Response, next: () => void) {
  const user = await prisma.user.findFirst({ where: { externalId: req.auth!.sub } });
  if (!user) return res.status(401).json({ success: false, message: 'Профиль не найден' });
  (req as Request & { authUser: typeof user }).authUser = user;
  next();
}

const requireAuth = [requireJwtAuth, attachDbUser];

const createSchema = z.object({
  teacherId: z.number(),
  date: z.string(), // YYYY-MM-DD
  time: z.string().optional(), // HH:MM
  room: z.string().optional(),
  expertIds: z.array(z.number()).min(1, 'Выберите хотя бы одного эксперта'),
});

/** GET /open-classes — список открытых занятий текущего преподавателя */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser as { id: number; role: string };
    if (authUser.role !== 'Преподаватель') {
      return res.status(403).json({ success: false, message: 'Доступ только для преподавателей' });
    }
    const classes = await prisma.openClass.findMany({
      where: { teacherId: authUser.id },
      orderBy: { date: 'desc' },
      include: {
        experts: { include: { expert: { select: { fullName: true } } } },
      },
    });
    const list = classes.map((c) => ({
      id: c.id,
      date: formatDate(c.date),
      time: c.time ?? '—',
      room: c.room ?? '—',
      experts: c.experts.map((e) => e.expert.fullName),
    }));
    return res.json({ success: true, data: list });
  } catch (e) {
    console.error('Open classes list error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/** POST /open-classes — создать открытое занятие (секретарь) */
router.post(
  '/',
  requireAuth,
  validateBody(createSchema),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const authUser = req.authUser as { role: string };
      if (authUser.role !== 'Секретарь') {
        return res.status(403).json({ success: false, message: 'Доступ только для секретаря' });
      }
      const validated = req.validated as z.infer<typeof createSchema>;
      const { teacherId, date, time, room, expertIds } = validated;
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true, role: true },
      });
      if (!teacher || teacher.role !== 'Преподаватель') {
        return res.status(400).json({ success: false, message: 'Укажите преподавателя' });
      }
      const dateObj = new Date(date);
      const openClass = await prisma.openClass.create({
        data: {
          teacherId,
          date: dateObj,
          time: time ?? null,
          room: room ?? null,
          experts: {
            create: expertIds.map((expertId) => ({ expertId })),
          },
        },
        include: {
          teacher: { select: { fullName: true } },
        },
      });
      return res.json({
        success: true,
        data: {
          id: openClass.id,
          date: formatDate(openClass.date),
          time: openClass.time ?? '—',
          room: openClass.room ?? '—',
          teacher: openClass.teacher.fullName,
          expertIds,
        },
      });
    } catch (e) {
      console.error('Open class create error', e);
      return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  }
);

/** GET /open-classes/all — все занятия (для секретаря) */
router.get('/all', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser as { role: string };
    if (authUser.role !== 'Секретарь') {
      return res.status(403).json({ success: false, message: 'Доступ только для секретаря' });
    }
    const classes = await prisma.openClass.findMany({
      orderBy: { date: 'desc' },
      include: {
        teacher: { select: { id: true, fullName: true } },
        experts: { include: { expert: { select: { id: true, fullName: true } } } },
      },
    });
    const list = classes.map((c) => ({
      id: c.id,
      date: formatDate(c.date),
      time: c.time ?? '—',
      room: c.room ?? '—',
      teacher: { id: String(c.teacher.id), name: c.teacher.fullName },
      experts: c.experts.map((e) => ({ id: String(e.expert.id), name: e.expert.fullName })),
    }));
    return res.json({ success: true, data: list });
  } catch (e) {
    console.error('Open classes all error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/** POST /open-classes/:id/student-result — отправить оценку студента (анонимно с SSID) */
router.post('/:id/student-result', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }
    const { result, ssid } = req.body as { result?: Record<string, unknown>; ssid?: string };

    if (!result || typeof result !== 'object') {
      return res.status(400).json({ success: false, message: 'Укажите результат оценки' });
    }
    if (!ssid) {
      return res.status(400).json({ success: false, message: 'Отсутствует идентификатор сессии (SSID)' });
    }

    const openClass = await prisma.openClass.findUnique({ where: { id } });
    if (!openClass) {
      return res.status(404).json({ success: false, message: 'Занятие не найдено' });
    }

    const existing = await prisma.resultOpenClassStudent.findFirst({
      where: { ssid, openClassId: id }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Вы уже оценивали это занятие' });
    }

    // Ищем актуальную анкету для студентов
    const form = await prisma.formFiles.findFirst({
      where: { formType: 'student_open_lesson' },
      orderBy: { createdAt: 'desc' },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: 'Анкета для студентов не найдена в системе' });
    }

    await prisma.resultOpenClassStudent.create({
      data: {
        ssid,
        result: JSON.stringify(result),
        formId: form.id,
        openClassId: id,
      },
    });
    return res.json({ success: true });
  } catch (e) {
    console.error('Student result submit error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/** GET /open-classes/:id/student-results — получить результаты оценки студентов (для секретаря) */
router.get('/:id/student-results', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser as { id: number; role: string };
    if (authUser.role !== 'Секретарь') {
      return res.status(403).json({ success: false, message: 'Доступ только для секретаря' });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }

    const results = await prisma.resultOpenClassStudent.findMany({
      where: { openClassId: id },
      orderBy: { id: 'desc' }
    });

    const parsedResults = results.map(r => ({
      id: r.id,
      ssid: r.ssid,
      createdAt: r.createdAt,
      result: JSON.parse(r.result)
    }));

    return res.json({ success: true, data: parsedResults });
  } catch (e) {
    console.error('Fetch student results error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/** GET /open-classes/expert/my-classes — список занятий, назначенных экспе́рту */
router.get('/expert/my-classes', requireAuth, async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser as { id: number; role: string };
    if (!authUser.role.includes('Эксперт')) {
      return res.status(403).json({ success: false, message: 'Доступ только для экспертов' });
    }
    const classes = await prisma.openClassExpert.findMany({
      where: { expertId: authUser.id },
      include: {
        openClass: {
          include: {
            teacher: { select: { fullName: true } },
          },
        },
      },
      orderBy: { openClass: { date: 'desc' } },
    });
    const list = classes.map((ce) => ({
      id: ce.openClass.id,
      date: formatDate(ce.openClass.date),
      time: ce.openClass.time ?? '—',
      room: ce.openClass.room ?? '—',
      teacher: ce.openClass.teacher.fullName,
      expertAssignmentId: ce.id,
    }));
    return res.json({ success: true, data: list });
  } catch (e) {
    console.error('Expert open classes list error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/** POST /open-classes/:id/expert-result — отправить оценку эксперта */
router.post('/:id/expert-result', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }

    const authUser = req.authUser as { id: number; role: string };
    if (!authUser.role.includes('Эксперт')) {
      return res.status(403).json({ success: false, message: 'Доступ только для экспертов' });
    }

    // Проверяем, что эксперт назначен на это занятие
    const expertAssignment = await prisma.openClassExpert.findFirst({
      where: {
        openClassId: id,
        expertId: authUser.id,
      },
    });

    if (!expertAssignment) {
      return res.status(403).json({ success: false, message: 'Вы не назначены на это занятие' });
    }

    const openClass = await prisma.openClass.findUnique({ where: { id } });
    if (!openClass) {
      return res.status(404).json({ success: false, message: 'Занятие не найдено' });
    }

    const body = req.body as { result?: Record<string, unknown> };
    const result = body?.result;
    if (!result || typeof result !== 'object') {
      return res.status(400).json({ success: false, message: 'Укажите результат оценки' });
    }

    // Ищем актуальную анкету для экспертов
    const form = await prisma.formFiles.findFirst({
      where: { formType: 'expert_open_lesson' },
      orderBy: { createdAt: 'desc' },
    });

    if (!form) {
      return res.status(404).json({ success: false, message: 'Анкета для экспертов не найдена в системе' });
    }

    // Удаляем старую оценку этого эксперта для этого занятия
    await prisma.resultOpenClassExpert.deleteMany({
      where: {
        openClassId: id,
        formId: form.id,
      },
    });

    await prisma.resultOpenClassExpert.create({
      data: {
        result: JSON.stringify(result),
        formId: form.id,
        openClassId: id,
      },
    });

    return res.json({ success: true });
  } catch (e) {
    console.error('Expert result submit error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

/** GET /open-classes/:id — информация об открытом занятии (для QR-ссылки, публичный доступ по id) */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }
    const openClass = await prisma.openClass.findUnique({
      where: { id },
      include: {
        teacher: { select: { fullName: true } },
      },
    });
    if (!openClass) {
      return res.status(404).json({ success: false, message: 'Занятие не найдено' });
    }
    return res.json({
      success: true,
      data: {
        id: openClass.id,
        date: formatDate(openClass.date),
        time: openClass.time ?? '—',
        room: openClass.room ?? '—',
        teacher: openClass.teacher.fullName,
      },
    });
  } catch (e) {
    console.error('Open class get error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
