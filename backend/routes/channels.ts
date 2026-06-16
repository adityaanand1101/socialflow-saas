import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/channels: Get all connected social accounts for the workspace
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    // Map the database models to the format expected by the frontend
    const channels = accounts.map(acc => ({
      id: acc.id,
      platform: acc.platform.toLowerCase(),
      name: acc.displayName || acc.username,
      username: acc.username,
      avatar: acc.avatarUrl || null,
      followers: 0, // Placeholder: Real stats would require fetching from platform APIs
      reach: 0,
      status: 'connected',
      engagementRate: 0,
      lastSynced: acc.updatedAt.toISOString()
    }));

    res.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// DELETE /api/channels/:id: Disconnect a social account
router.delete('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    await prisma.socialAccount.delete({
      where: { id, workspaceId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to disconnect channel' });
  }
});

export default router;
