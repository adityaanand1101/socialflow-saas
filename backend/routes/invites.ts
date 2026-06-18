import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/invites/resolve?token=XYZ
// Public endpoint: does NOT require auth so non-logged-in users can see invite details
router.get('/resolve', async (req: any, res: any) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token: token as string },
      include: { workspace: { select: { id: true, name: true } } }
    });

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.status !== 'PENDING') return res.status(400).json({ error: 'Invite is no longer valid' });
    if (new Date(invite.expiresAt) < new Date()) return res.status(400).json({ error: 'Invite has expired' });

    res.json({
      workspaceId: invite.workspace.id,
      workspaceName: invite.workspace.name,
      role: invite.role,
      email: invite.email
    });
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

    // Verify email only if the invite was sent to a specific email
    const user = req.dbUser;
    if (invite.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({
        error: 'This invitation was sent to a different email address',
        invitedEmail: invite.email
      });
    }

    // Check if user is already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } }
    });
    if (existing) {
      return res.status(400).json({ error: 'You are already a member of this workspace' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' }
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: invite.workspaceId,
          role: invite.role
        }
      });

      await tx.activityLog.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          action: 'member.joined',
          details: `${user.name || user.email} joined the workspace`
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
