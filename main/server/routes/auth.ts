import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const updateProfileSchema = z.object({
  positions: z.string().optional(),
  department: z.string().optional(),
});

// GET /auth/me — текущий пользователь (Keycloak JWT). Если в БД нет — создаём профиль автоматически.
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const a = req.auth!;
    let user = await prisma.user.findFirst({
      where: { externalId: a.sub },
    });
    if (!user) {
      const existingUser = await prisma.user.findUnique({
        where: { login: a.username },
      });

      if (existingUser) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { externalId: a.sub },
        });
      } else {
        user = await prisma.user.create({
          data: {
            externalId: a.sub,
            login: a.username,
            password: null,
            fullName: a.fullName,
            role: a.appRole,
            positions: null,
            department: null,
            expirationDate: null,
          },
        });
      }
    }

    if (user.expirationDate && new Date(user.expirationDate) < new Date()) {
      return res.status(403).json({ success: false, message: 'Срок действия вашего аккаунта истек' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        login: user.login,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        positions: user.positions,
        expirationDate: user.expirationDate?.toISOString() ?? null,
      },
    });
  } catch (e) {
    console.error('Auth me error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// PATCH /auth/profile — обновление профиля текущего пользователя
router.patch(
  '/profile',
  requireAuth,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response) => {
    try {
      const a = req.auth!;
      const body = req.validated as z.infer<typeof updateProfileSchema>;
      const user = await prisma.user.upsert({
        where: { externalId: a.sub },
        create: {
          externalId: a.sub,
          login: a.username,
          password: null,
          fullName: a.fullName,
          role: a.appRole,
          positions: body.positions || null,
          department: body.department || null,
          expirationDate: null,
        },
        update: {
          ...(body.positions !== undefined && { positions: body.positions || null }),
          ...(body.department !== undefined && { department: body.department || null }),
        },
      });
      return res.json({
        success: true,
        data: {
          id: user.id,
          login: user.login,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          positions: user.positions,
          expirationDate: user.expirationDate?.toISOString() ?? null,
        },
      });
    } catch (e) {
      console.error('Profile update error', e);
      return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
  }
);

export default router;
