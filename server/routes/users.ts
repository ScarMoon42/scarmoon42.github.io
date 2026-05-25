import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireAppRole } from '../middleware/auth.js';
import { createUserAndAssignRealmRole, deleteUser as kcDeleteUser, setUserRealmRole } from '../lib/keycloakAdmin.js';

const router = Router();

const ROLES = ['Преподаватель', 'Эксперт', 'Внешний эксперт', 'Секретарь'] as const;

const createUserSchema = z.object({
  fullName: z.string().min(1, 'Укажите ФИО'),
  login: z.string().min(1, 'Укажите логин'),
  password: z.string().min(1, 'Укажите пароль'),
  role: z.enum(ROLES),
  positions: z.string().optional(),
  department: z.string().optional(),
  isTemporary: z.boolean().optional(),
  expirationDate: z.string().optional(), // YYYY-MM-DD или ISO
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  login: z.string().min(1).optional(),
  role: z.enum(ROLES).optional(),
  positions: z.string().optional(),
  department: z.string().optional(),
  isTemporary: z.boolean().optional(),
  expirationDate: z.string().optional().nullable(), // ISO или YYYY-MM-DD
});

// GET /users — список пользователей (для секретаря)
router.get('/', requireAuth, requireAppRole(['Секретарь']), async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        login: true,
        fullName: true,
        role: true,
        department: true,
        positions: true,
        expirationDate: true,
        createdAt: true,
      },
    });
    const list = users.map((u) => ({
      id: String(u.id),
      login: u.login,
      name: u.fullName,
      role: u.role,
      department: u.department ?? undefined,
      positions: u.positions ?? undefined,
      isTemporary: !!u.expirationDate,
      expirationDate: u.expirationDate?.toISOString().slice(0, 10),
    }));
    return res.json({ success: true, data: list });
  } catch (e) {
    console.error('Users list error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// POST /users — создание пользователя (секретарь)
router.post(
  '/',
  requireAuth,
  requireAppRole(['Секретарь']),
  validateBody(createUserSchema),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const body = req.validated as z.infer<typeof createUserSchema>;
      const existing = await prisma.user.findUnique({ where: { login: body.login.trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Пользователь с таким логином уже существует' });
      }

      const roleMap: Record<(typeof ROLES)[number], 'secretary' | 'teacher' | 'expert' | 'external_expert'> = {
        'Секретарь': 'secretary',
        'Преподаватель': 'teacher',
        'Эксперт': 'expert',
        'Внешний эксперт': 'external_expert',
      };

      const kc = await createUserAndAssignRealmRole({
        username: body.login.trim(),
        fullName: body.fullName.trim(),
        password: body.password,
        realmRole: roleMap[body.role],
      });

      const expirationDate = body.isTemporary && body.expirationDate ? new Date(body.expirationDate) : null;
      const user = await prisma.user.create({
        data: {
          externalId: kc.id,
          login: body.login.trim(),
          password: null,
          fullName: body.fullName.trim(),
          role: body.role,
          positions: body.positions ?? null,
          department: body.department ?? null,
          expirationDate,
        },
      });
      return res.json({
        success: true,
        data: {
          id: String(user.id),
          login: user.login,
          name: user.fullName,
          role: user.role,
          isTemporary: !!user.expirationDate,
          expirationDate: user.expirationDate?.toISOString().slice(0, 10),
        },
      });
    } catch (e: any) {
      console.error('User create error', e);
      const message = e?.message?.includes('Keycloak') ? e.message : 'Ошибка сервера';
      return res.status(500).json({ success: false, message });
    }
  }
);

// PATCH /users/:id — обновление (роль, ФИО и т.д.)
router.patch(
  '/:id',
  requireAuth,
  requireAppRole(['Секретарь']),
  validateBody(updateUserSchema),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Некорректный id' });
      }
      const body = req.validated as z.infer<typeof updateUserSchema>;
      // Если меняем роль — синхронизируем с Keycloak (realm role)
      if (body.role) {
        const dbUser = await prisma.user.findUnique({ where: { id }, select: { externalId: true } });
        if (dbUser?.externalId) {
          const roleMap: Record<(typeof ROLES)[number], 'secretary' | 'teacher' | 'expert' | 'external_expert'> = {
            'Секретарь': 'secretary',
            'Преподаватель': 'teacher',
            'Эксперт': 'expert',
            'Внешний эксперт': 'external_expert',
          };
          await setUserRealmRole({ userId: dbUser.externalId, realmRole: roleMap[body.role] });
        }
      }
      if (body.login) {
        const existing = await prisma.user.findFirst({
          where: { login: body.login.trim(), NOT: { id } },
        });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Пользователь с таким логином уже существует' });
        }
      }
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(body.fullName && { fullName: body.fullName }),
          ...(body.login && { login: body.login.trim() }),
          ...(body.role && { role: body.role }),
          ...(body.positions !== undefined && { positions: body.positions }),
          ...(body.department !== undefined && { department: body.department }),
          ...(body.expirationDate !== undefined && {
            expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
          }),
        },
      });
      return res.json({
        success: true,
        data: {
          id: String(user.id),
          login: user.login,
          name: user.fullName,
          role: user.role,
          isTemporary: !!user.expirationDate,
          expirationDate: user.expirationDate?.toISOString().slice(0, 10),
        },
      });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Пользователь не найден' });
      }
      console.error('User update error', e);
      return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  }
);

// PATCH /users/:id/extend-expiration — продление срока действия временного аккаунта
router.patch(
  '/:id/extend-expiration',
  requireAuth,
  requireAppRole(['Секретарь']),
  validateBody(z.object({ expirationDate: z.string().min(1, 'Укажите дату') })),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Некорректный id' });
      }
      const expirationDateStr = ((req as any).validated as { expirationDate: string }).expirationDate;
      const newExpirationDate = new Date(expirationDateStr);
      if (isNaN(newExpirationDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Некорректная дата' });
      }
      const user = await prisma.user.update({
        where: { id },
        data: { expirationDate: newExpirationDate },
      });
      return res.json({
        success: true,
        data: {
          id: String(user.id),
          login: user.login,
          name: user.fullName,
          role: user.role,
          isTemporary: !!user.expirationDate,
          expirationDate: user.expirationDate?.toISOString().slice(0, 10),
        },
      });
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Пользователь не найден' });
      }
      console.error('User extend expiration error', e);
      return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  }
);

// DELETE /users/:id
router.delete('/:id', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Некорректный id' });
    }
    // Запретить удаление собственного аккаунта
    const me = await prisma.user.findFirst({ where: { externalId: req.auth!.sub }, select: { id: true } });
    if (me && id === me.id) return res.status(403).json({ success: false, message: 'Вы не можете удалить собственный аккаунт' });
    const victim = await prisma.user.findUnique({ where: { id }, select: { externalId: true } });
    if (victim?.externalId) await kcDeleteUser({ userId: victim.externalId });
    await prisma.user.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    console.error('User delete error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

function normalizeAnswer(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function calculateSurveyScore(results: Array<{ result: string }>, maxScore: number = 10): number {
  if (results.length === 0) return 0;
  let totalVal = 0;
  let count = 0;
  results.forEach(r => {
    try {
      const resObj = JSON.parse(r.result);
      Object.values(resObj).forEach((v: any) => {
        let num: number | null = null;
        if (v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes') {
          num = 4;
        } else if (v === false || String(v).toLowerCase() === 'false' || String(v).toLowerCase() === 'no') {
          num = 1;
        } else {
          const strVal = String(v);
          const match = strVal.match(/\d+/);
          if (match) {
            num = parseInt(match[0], 10);
          }
        }

        if (num !== null && !isNaN(num)) {
          totalVal += num;
          count++;
        }
      });
    } catch (e) { /* ignore parse errors */ }
  });

  if (count === 0) return 0;
  const average = totalVal / count;
  // Assume standard Likert scale (1-4). If average >= 4, it gives maxScore.
  return Math.min(maxScore, Math.round((average / 4) * maxScore));
}

function calculateTeacherTestScore(results: Array<{ result: string; test: { parsedData: string | null } }>): number {
  if (results.length === 0) return 0;
  
  let totalPercentage = 0;
  let validTestsCount = 0;

  results.forEach(res => {
    try {
      if (!res.test.parsedData) return;
      const parsedData = JSON.parse(res.test.parsedData);
      const questions = parsedData.questions ?? [];
      if (questions.length === 0) return;

      const answersMap = JSON.parse(res.result);
      let totalScore = 0;
      let maxScore = 0;

      questions.forEach((question: any, idx: number) => {
        const questionKey = String(idx);
        const selectedAnswer = answersMap[questionKey] !== undefined ? normalizeAnswer(answersMap[questionKey]) : '';
        
        // Calculate max possible score for this question
        // For each option, max score is its weight (or 100 if not specified)
        let questionMaxScore = 100;
        if (question.options && Array.isArray(question.options)) {
          // For weighted questions, max score is the sum of all positive weights
          const positiveWeights = question.options
            .map((opt: any) => opt.weight ?? (opt.isCorrect ? 100 : 0))
            .filter((w: number) => w > 0);
          if (positiveWeights.length > 0) {
            questionMaxScore = positiveWeights.reduce((a: number, b: number) => a + b, 0);
          }
        }
        maxScore += questionMaxScore;

        // Calculate score for selected answer
        if (selectedAnswer !== '') {
          if (question.options && Array.isArray(question.options)) {
            // Find matching option and get its weight
            const selectedOption = question.options.find((opt: any) => 
              normalizeAnswer(opt.text) === selectedAnswer
            );
            if (selectedOption) {
              const weight = selectedOption.weight ?? (selectedOption.isCorrect ? 100 : 0);
              totalScore += Math.max(0, weight); // Only count positive weights
            }
          } else {
            // Fallback for simple questions without options structure
            const correctAnswers = (question.correctAnswers ?? []).map((ans: any) => normalizeAnswer(ans));
            if (correctAnswers.includes(selectedAnswer)) {
              totalScore += 100;
            }
          }
        }
      });

      if (maxScore > 0) {
        totalPercentage += totalScore / maxScore;
        validTestsCount++;
      }
    } catch (e) { /* ignore parse errors */ }
  });

  if (validTestsCount === 0) return 0;
  const averagePercentage = totalPercentage / validTestsCount;
  return Math.min(20, Math.round(averagePercentage * 20));
}

// GET /users/ranking — рейтинг преподавателей (для секретаря)
router.get('/ranking', requireAuth, requireAppRole(['Секретарь']), async (_req: Request, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'Преподаватель' },
      select: {
        id: true,
        fullName: true,
        positions: true,
        department: true,
      },
    });

    const ranking = [];

    for (const teacher of teachers) {
      // 1. УМК (Category 1) - max 20
      const umkFiles = await prisma.file.findMany({
        where: { userId: teacher.id, comment: { contains: 'УМК' } },
      });
      const cat1ScoreRaw = umkFiles.filter(f => f.status === 'Принято').length * 5;
      const cat1Score = Math.min(20, cat1ScoreRaw);

      // 2. ПК (Category 2) - max 10
      const pkFiles = await prisma.file.findMany({
        where: { userId: teacher.id, comment: { contains: 'ПК' } },
      });
      const cat2ScoreRaw = pkFiles.filter(f => f.status === 'Принято').length * 2;
      const cat2Score = Math.min(10, cat2ScoreRaw);

      // 3. Студенты (Category 3) - max 10
      const studentResults = await prisma.resultOpenClassStudent.findMany({
        where: { openClass: { teacherId: teacher.id } },
      });
      const cat3Score = calculateSurveyScore(studentResults, 10);

      // 4. Тесты (Category 4) - max 20
      const testResults = await prisma.resultTestTeacher.findMany({
        where: { teacherId: teacher.id },
        include: { test: true },
      });
      const cat4Score = calculateTeacherTestScore(testResults);

      // 5. Экспертная оценка файлов (Анкетирование работодателем) (Category 5) - max 10
      const expertResultFiles = await prisma.resultFiles.findMany({
        where: {
          teacherId: teacher.id,
          form: { formType: 'expert_file_eval' },
        },
      });
      const cat5Score = calculateSurveyScore(expertResultFiles, 10);

      // 6. Оценка открытого занятия экспертами (Category 6) - max 10
      const expertResultOpenClasses = await prisma.resultOpenClassExpert.findMany({
        where: { openClass: { teacherId: teacher.id } }
      });
      const cat6Score = calculateSurveyScore(expertResultOpenClasses, 10);

      const totalRating = cat1Score + cat2Score + cat3Score + cat4Score + cat5Score + cat6Score;

      ranking.push({
        id: String(teacher.id),
        name: teacher.fullName,
        position: teacher.positions || 'Не указана',
        department: teacher.department || 'Не указана',
        rating: totalRating,
        details: [
          { category: "1 Оценка УМК", score: cat1Score, maxScore: 20 },
          { category: "2 Повышение квалификации", score: cat2Score, maxScore: 10 },
          { category: "3 Анкетирование обучающихся", score: cat3Score, maxScore: 10 },
          { category: "4 Предметные компетенции (тест)", score: cat4Score, maxScore: 20 },
          { category: "5 Анкетирование работодателем", score: cat5Score, maxScore: 10 },
          { category: "6 Оценка открытого занятия экспертами", score: cat6Score, maxScore: 10 },
        ],
      });
    }

    return res.json({ success: true, data: ranking });
  } catch (e) {
    console.error('Users ranking error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
