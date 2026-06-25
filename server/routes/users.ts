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
        password: true,
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
      password: u.password,
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
          password: body.password,
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

function parseNumericAnswer(value: unknown): number | null {
  if (value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes') {
    return 3;
  }
  if (value === false || String(value).toLowerCase() === 'false' || String(value).toLowerCase() === 'no') {
    return 0;
  }
  const strVal = String(value).trim();
  if (!strVal) return null;
  const match = strVal.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseNumericOptionText(optionText: unknown): number | null {
  const str = String(optionText).trim();
  if (!str) return null;
  const match = str.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getSurveyQuestionMaxScale(parsedData: any, questionIndex: number, fallback = 3): number {
  if (!parsedData || !Array.isArray(parsedData.questions)) return fallback;
  const question = parsedData.questions[questionIndex];
  if (!question || !Array.isArray(question.options) || question.options.length <= 1) return fallback;

  const numericOptions = question.options
    .map((opt: any) => parseNumericOptionText(opt.text))
    .filter((num: number | null): num is number => num !== null && Number.isFinite(num));

  if (numericOptions.length > 1) {
    return Math.max(...numericOptions);
  }

  return fallback;
}

function isNumericRatingQuestion(question: any): boolean {
  if (!question || !Array.isArray(question.options) || question.options.length <= 1) return false;
  return question.options.every((opt: any) => {
    const numericValue = parseNumericOptionText(opt.text);
    return numericValue !== null && Number.isFinite(numericValue);
  });
}

function getQuestionOptionWeight(question: any, option: any): number {
  if (typeof option.weight === 'number') return option.weight;
  if (option.isCorrect) return 100;
  if (isNumericRatingQuestion(question)) {
    const numericText = parseNumericOptionText(option.text);
    return numericText !== null && Number.isFinite(numericText) ? numericText : 0;
  }
  return 0;
}

/**
 * Считает балл по анкете с заданным числом вопросов и максимальным баллом за вопрос.
 * Берёт все ответы, делит по вопросам (ключи 0..N-1), усредняет по числу заполнивших,
 * нормирует на шкалу 0–3, возвращает итог не более numQuestions * pointsPerQuestion.
 */
function calculateSurveyScoreByQuestions(
  results: Array<{ result: string; form?: { parsedData: string | null } }> | Array<{ result: string }>,
  numQuestions: number,
  pointsPerQuestion: number
): number {
  if (results.length === 0) return 0;

  const maxTotal = numQuestions * pointsPerQuestion;
  const questionTotals: number[] = new Array(numQuestions).fill(0);
  const questionCounts: number[] = new Array(numQuestions).fill(0);
  const questionMaxScale: number[] = new Array(numQuestions).fill(0);

  results.forEach((r) => {
    try {
      const parsedForm = (r as any).form?.parsedData ? JSON.parse((r as any).form.parsedData) : null;
      const resObj = JSON.parse(r.result) as Record<string, unknown>;
      Object.entries(resObj).forEach(([key, v]) => {
        const qIdx = parseInt(key, 10);
        if (isNaN(qIdx) || qIdx < 0 || qIdx >= numQuestions) return;

        const parsedScale = getSurveyQuestionMaxScale(parsedForm, qIdx, 3);
        questionMaxScale[qIdx] = Math.max(questionMaxScale[qIdx], parsedScale);

        const num = parseNumericAnswer(v);
        if (num !== null && !isNaN(num)) {
          questionTotals[qIdx] += num;
          questionCounts[qIdx]++;
        }
      });
    } catch { /* ignore */ }
  });

  let totalScore = 0;
  for (let i = 0; i < numQuestions; i++) {
    if (questionCounts[i] === 0) continue;
    const avg = questionTotals[i] / questionCounts[i];
    const scale = questionMaxScale[i] > 0 ? questionMaxScale[i] : 3;
    totalScore += Math.round((avg / scale) * pointsPerQuestion * 10) / 10;
  }

  return Math.min(maxTotal, Math.round(totalScore * 10) / 10);
}

/**
 * Считает балл по чек-листу эксперта на открытом занятии.
 * numGroups — число групп компетенций, pointsPerGroup — баллов за группу (итого numGroups * pointsPerGroup).
 * Если вопросы разбиты по группам равномерно, делим на numGroups равных сегментов.
 */
function calculateChecklistScore(
  results: Array<{ result: string }>,
  numGroups: number,
  pointsPerGroup: number
): number {
  if (results.length === 0) return 0;
  const maxTotal = numGroups * pointsPerGroup;

  // Собираем все числовые ответы из всех результатов
  let totalVal = 0;
  let count = 0;
  let maxObservedValue = 0;
  results.forEach(r => {
    try {
      const resObj = JSON.parse(r.result) as Record<string, unknown>;
      Object.values(resObj).forEach((v) => {
        let num: number | null = null;
        if (v === true || String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes') {
          num = 3;
        } else if (v === false || String(v).toLowerCase() === 'false' || String(v).toLowerCase() === 'no') {
          num = 0;
        } else {
          const strVal = String(v).trim();
          const match = strVal.match(/-?\d+(?:\.\d+)?/);
          if (match) num = Number(match[0]);
        }
        if (num !== null && !isNaN(num)) {
          totalVal += num;
          count++;
          maxObservedValue = Math.max(maxObservedValue, num);
        }
      });
    } catch { /* ignore */ }
  });

  if (count === 0) return 0;
  const average = totalVal / count;
  const scale = maxObservedValue > 0 ? maxObservedValue : 3;
  const score = Math.round((average / scale) * maxTotal * 10) / 10;
  return Math.min(maxTotal, score);
}

/**
 * Считает балл за тестирование: numQuestions вопросов × pointsPerQuestion балла.
 * Итоговый балл = процент правильных × (numQuestions * pointsPerQuestion).
 */
function calculateTeacherTestScoreNew(
  results: Array<{ result: string; test: { parsedData: string | null } }>,
  numQuestions: number,
  pointsPerQuestion: number
): number {
  if (results.length === 0) return 0;
  const maxTotal = numQuestions * pointsPerQuestion; // 20 × 0.5 = 10

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
        const selectedAnswers = Array.isArray(answersMap[questionKey])
          ? (answersMap[questionKey] as any[]).map(a => normalizeAnswer(a))
          : (selectedAnswer !== '' ? [selectedAnswer] : []);

        let questionMaxScore = 100;
        let gainedScore = 0;
        const ratingQuestion = question.type === 'rating' || isNumericRatingQuestion(question);

        if (question.options && Array.isArray(question.options)) {
          if (ratingQuestion) {
            const numericOptions = question.options
              .map((opt: any) => parseNumericOptionText(opt.text))
              .filter((value: number | null): value is number => value !== null && Number.isFinite(value));
            if (numericOptions.length > 0) {
              questionMaxScore = Math.max(...numericOptions);
            }
          } else {
            const positiveWeights = question.options
              .map((opt: any) => getQuestionOptionWeight(question, opt))
              .filter((w: number) => w > 0);
            if (positiveWeights.length > 0) {
              questionMaxScore = positiveWeights.reduce((a: number, b: number) => a + b, 0);
            }
          }

          selectedAnswers.forEach((answer) => {
            if (answer !== '') {
              const selectedOption = question.options.find((opt: any) =>
                normalizeAnswer(opt.text) === answer
              );
              if (selectedOption) {
                if (ratingQuestion) {
                  const numericValue = parseNumericOptionText(selectedOption.text);
                  gainedScore += numericValue !== null && Number.isFinite(numericValue) ? numericValue : 0;
                } else {
                  const weight = getQuestionOptionWeight(question, selectedOption);
                  gainedScore += weight;
                }
              }
            }
          });
        } else {
          const correctAnswers = (question.correctAnswers ?? []).map((ans: any) => normalizeAnswer(ans));
          const isCorrect = selectedAnswers.length > 0 && selectedAnswers.some(ans => correctAnswers.includes(ans));
          gainedScore = isCorrect ? 100 : 0;
        }

        gainedScore = Math.max(0, Math.min(gainedScore, questionMaxScore));
        totalScore += gainedScore;
        maxScore += questionMaxScore;
      });

      if (maxScore > 0) {
        totalPercentage += totalScore / maxScore;
        validTestsCount++;
      }
    } catch { /* ignore */ }
  });

  if (validTestsCount === 0) return 0;
  const averagePercentage = totalPercentage / validTestsCount;
  return Math.min(maxTotal, Math.round(averagePercentage * maxTotal * 10) / 10);
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
      // ─────────────────────────────────────────────────────────────────────
      // 1. Оценка курсового проекта / УМК — 10 баллов (5 показателей по 2 б.)
      //    Оценка проводится через экспертную форму, загруженную секретарем.
      // ─────────────────────────────────────────────────────────────────────
      const expertKpUmkResults = await prisma.resultFiles.findMany({
        where: {
          teacherId: teacher.id,
          form: { formType: 'expert_kp_umk' },
        },
        include: { form: { select: { parsedData: true } } },
      });
      const cat1Score = calculateSurveyScoreByQuestions(expertKpUmkResults, 5, 2);

      // ─────────────────────────────────────────────────────────────────────
      // 2. Документы ПК (за последние 3 года) — 10 баллов
      //    1 документ = 1 балл, не более 10 документов
      // ─────────────────────────────────────────────────────────────────────
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const pkFiles = await prisma.file.findMany({
        where: {
          userId: teacher.id,
          status: 'Принято',
          OR: [
            { comment: { contains: 'ПК' } },
            { comment: { contains: 'повышение квалификации' } },
            { comment: { contains: 'квалификац' } },
          ],
          createdAt: { gte: threeYearsAgo },
        },
      });
      const pkCount = Math.min(pkFiles.length, 10);
      const cat2Score = pkCount; // 1 б. за документ, max 10

      // ─────────────────────────────────────────────────────────────────────
      // 3. Анкета обучающихся — 15 баллов (5 вопросов по 3 б.)
      // ─────────────────────────────────────────────────────────────────────
      const studentResults = await prisma.resultOpenClassStudent.findMany({
        where: { openClass: { teacherId: teacher.id } },
      });
      const cat3Score = calculateSurveyScoreByQuestions(studentResults, 5, 3);

      // ─────────────────────────────────────────────────────────────────────
      // 4. Чек-лист эксперта (открытое занятие) — 40 баллов
      //    4 группы компетенций по 10 б.
      // ─────────────────────────────────────────────────────────────────────
      const expertOpenClassResults = await prisma.resultOpenClassExpert.findMany({
        where: { openClass: { teacherId: teacher.id } },
      });
      const cat4Score = calculateChecklistScore(expertOpenClassResults, 4, 10);

      // ─────────────────────────────────────────────────────────────────────
      // 5. Анкета работодателей — 15 баллов (5 показателей по 3 б.)
      // ─────────────────────────────────────────────────────────────────────
      const employerResults = await prisma.resultFiles.findMany({
        where: {
          teacherId: teacher.id,
          form: { formType: 'expert_file_eval' },
        },
        include: { form: { select: { parsedData: true } } },
      });
      const cat5Score = calculateSurveyScoreByQuestions(employerResults, 5, 3);

      // ─────────────────────────────────────────────────────────────────────
      // 6. Тестирование — 10 баллов (20 вопросов по 0,5 б.)
      // ─────────────────────────────────────────────────────────────────────
      const testResults = await prisma.resultTestTeacher.findMany({
        where: { teacherId: teacher.id },
        include: { test: true },
      });
      const cat6Score = calculateTeacherTestScoreNew(testResults, 20, 0.5);

      const totalRating = Math.round(
        (cat1Score + cat2Score + cat3Score + cat4Score + cat5Score + cat6Score) * 10
      ) / 10;

      ranking.push({
        id: String(teacher.id),
        name: teacher.fullName,
        position: teacher.positions || 'Не указана',
        department: teacher.department || 'Не указана',
        rating: totalRating,
        details: [
          {
            category: 'Оценка курсового проекта / УМК',
            score: cat1Score,
            maxScore: 10,
            hint: `5 показателей по 2 б. (оценено: ${expertKpUmkResults.length})`,
          },
          {
            category: 'Документы ПК (за последние 3 года)',
            score: cat2Score,
            maxScore: 10,
            hint: `1 документ = 1 б. (принято: ${pkCount} из 10)`,
          },
          {
            category: 'Анкета обучающихся',
            score: cat3Score,
            maxScore: 15,
            hint: '5 вопросов по 3 б.',
          },
          {
            category: 'Чек-лист эксперта (открытое занятие)',
            score: cat4Score,
            maxScore: 40,
            hint: '4 группы компетенций по 10 б.',
          },
          {
            category: 'Анкета работодателей',
            score: cat5Score,
            maxScore: 15,
            hint: '5 показателей по 3 б.',
          },
          {
            category: 'Тестирование',
            score: cat6Score,
            maxScore: 10,
            hint: '20 вопросов по 0,5 б.',
          },
        ],
      });
    }

    // Сортируем по убыванию рейтинга
    ranking.sort((a, b) => b.rating - a.rating);

    return res.json({ success: true, data: ranking });
  } catch (e) {
    console.error('Users ranking error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
