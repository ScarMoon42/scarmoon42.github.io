import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import type { Request } from 'express';
import { requireAuth, requireAppRole } from '../middleware/auth.js';

const router = Router();

// --- Positions ---

router.get('/positions', requireAuth, async (_req: Request, res: Response) => {
    try {
        const list = await prisma.position.findMany({ orderBy: { name: 'asc' } });
        return res.json(list);
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/positions', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Название обязательно' });
        const item = await prisma.position.create({ data: { name } });
        return res.json(item);
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/positions/:id', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.position.delete({ where: { id } });
        return res.json({ message: 'Удалено' });
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// --- Departments ---

router.get('/departments', requireAuth, async (_req: Request, res: Response) => {
    try {
        const list = await prisma.department.findMany({ orderBy: { name: 'asc' } });
        return res.json(list);
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/departments', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Название обязательно' });
        const item = await prisma.department.create({ data: { name } });
        return res.json(item);
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/departments/:id', requireAuth, requireAppRole(['Секретарь']), async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.department.delete({ where: { id } });
        return res.json({ message: 'Удалено' });
    } catch (e) {
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

export default router;
