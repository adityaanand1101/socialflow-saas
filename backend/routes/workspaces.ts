import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import { checkSaaSLimits, requireRole } from '../middlewares/limits';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// POST /api/workspaces: Create new workspace
router.post('/', requireAuth, checkSaaSLimits('workspaces'), async (req: any, res: any) => {
  const { name } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Workspace name is required' });

  try {
    const slug = `workspace-${req.userId}-${Date.now()}`;
    const workspace = await prisma.workspace.create({
      data: { name, slug }
    });

    await prisma.workspaceMember.create({
      data: { userId: req.userId, workspaceId: workspace.id, role: 'OWNER' }
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/workspaces/:id: Update workspace
router.patch('/:id', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: any, res: any) => {
  const { id } = req.params;
  const { name, logoUrl } = req.body;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logoUrl !== undefined && { logoUrl })
      }
    });
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workspaces/:id/invites: Invite a member
router.post('/:id/invites', requireAuth, requireRole(['OWNER', 'ADMIN']), checkSaaSLimits('seats'), async (req: any, res: any) => {
  const { id } = req.params;
  const { email, role } = req.body;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email,
        role: role || 'MEMBER',
        token,
        expiresAt
      }
    });

    // In a real app, send an email via Resend/SendGrid here using invite.token
    console.log(`Simulating email to ${email} with invite link: http://localhost:5173/invite?token=${token}`);

    res.status(201).json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
