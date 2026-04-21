import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { Request } from 'express';
import { requireAuth, requireAppRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireAppRole(['Секретарь']), async (_req: Request, res: Response) => {
    try {
        const list = await prisma.expertAssignment.findMany({
            include: {
                teacher: { select: { id: true, fullName: true } },
                expert: { select: { id: true, fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(list);
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
    try {
        const { teacherId, expertId } = req.body;
        if (!teacherId || !expertId) return res.status(400).json({ message: 'Нужны teacherId и expertId' });

        const item = await prisma.expertAssignment.create({
            data: {
                teacherId: parseInt(teacherId, 10),
                expertId: parseInt(expertId, 10)
            },
            include: {
                teacher: { select: { id: true, fullName: true } },
                expert: { select: { id: true, fullName: true } }
            }
        });
        return res.json(item);
    } catch (e) {
        console.error('Assignment error', e);
        return res.status(500).json({ message: 'Ошибка сервера или назначение уже существует' });
    }
});

router.delete('/:id', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.expertAssignment.delete({ where: { id } });
        return res.json({ message: 'Удалено' });
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;
