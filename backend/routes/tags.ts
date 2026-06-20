import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

router.get('/', async (req: any, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });
    const workspaceIds = memberships.map(m => m.workspace.id);

    const tags = await prisma.tag.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { name: 'asc' }
    });

    res.json(tags);
  } catch (err: any) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { name, color, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ error: 'Name and workspaceId are required' });
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId }
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const tag = await prisma.tag.create({
      data: { name, color: color || '#7C3AED', workspaceId }
    });

    res.status(201).json(tag);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Tag already exists in this workspace' });
    }
    console.error('Error creating tag:', err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

router.patch('/:id', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, color } = req.body;

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: tag.workspaceId }
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: { name, color }
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating tag:', err);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: tag.workspaceId }
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    await prisma.tag.delete({ where: { id } });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;