import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { Request } from 'express';
import { requireAuth, requireAppRole } from '../middleware/auth.js';

const router = Router();

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).split('-').reverse().join('.');
}

/** GET /candidates — список кандидатов (претендентов ППС) для эксперта */
router.get('/', requireAuth, requireAppRole(['Эксперт', 'Внешний эксперт']), async (req: Request, res: Response) => {
  try {
    const expertId = (req as any).auth?.id;
    if (!expertId) return res.status(401).json({ success: false, message: 'Не авторизован' });

    // Ищем только тех преподавателей, которые назначены данному эксперту
    const assignments = await prisma.expertAssignment.findMany({
      where: { expertId: parseInt(expertId, 10) },
      select: { teacherId: true }
    });

    const teacherIds = assignments.map(a => a.teacherId);

    const users = await prisma.user.findMany({
      where: {
        id: { in: teacherIds },
        role: 'Преподаватель'
      },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        positions: true,
        department: true,
        createdAt: true,
      },
    });
    const list = users.map((u) => ({
      id: String(u.id),
      name: u.fullName,
      position: u.positions ?? '—',
      department: u.department ?? '—',
      applicationDate: formatDate(u.createdAt),
    }));
    return res.json({ success: true, data: list });
  } catch (e) {
    console.error('Candidates list error', e);
    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

export default router;
