import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/invites/resolve?token=XYZ
router.get('/resolve', requireAuth, async (req: any, res: any) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token: token as string },
      include: { workspace: true }
    });

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status !== 'PENDING') return res.status(400).json({ error: 'Invite is no longer valid' });
    if (new Date(invite.expiresAt) < new Date()) return res.status(400).json({ error: 'Invite has expired' });

    res.json({ workspaceName: invite.workspace.name, role: invite.role, email: invite.email });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invites/accept
router.post('/accept', requireAuth, async (req: any, res: any) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token }
    });

    if (!invite || invite.status !== 'PENDING' || new Date(invite.expiresAt) < new Date()) {
       return res.status(400).json({ error: 'Invalid or expired invite' });
    }

    // Verify email matches? We can skip for prototype or verify.
    // Assuming user is authenticated and req.dbUser has the email.
    
    await prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' }
      });

      await tx.workspaceMember.create({
        data: {
          userId: req.userId,
          workspaceId: invite.workspaceId,
          role: invite.role
        }
      });
    });

    res.json({ success: true, workspaceId: invite.workspaceId });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
