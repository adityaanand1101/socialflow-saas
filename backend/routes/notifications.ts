import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications — list notifications for current user
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: req.userId, read: false },
      }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', requireAuth, async (req: any, res: any) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', requireAuth, async (req: any, res: any) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/notifications — internal helper (called from other routes)
async function createNotification(
  prisma: PrismaClient,
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string,
  workspaceId?: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link, workspaceId },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export { router as default, createNotification };
