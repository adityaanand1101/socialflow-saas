import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import { checkSaaSLimits, requireRole } from '../middlewares/limits';
import crypto from 'crypto';
import { Resend } from 'resend';

const router = Router();
const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    await logActivity(prisma, workspace.id, req.userId, 'workspace.created', `Created workspace "${name}"`);

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces: List user's workspaces
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.userId },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } }
          }
        }
      }
    });

    const workspaces = memberships.map(m => ({
      ...m.workspace,
      role: m.role,
      memberCount: m.workspace._count.members
    }));

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id: Get workspace details
router.get('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, invites: { where: { status: 'PENDING' } } } }
      }
    });

    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json(workspace);
  } catch (error) {
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

    await logActivity(prisma, id, req.userId, 'workspace.updated', `Updated workspace settings`);

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id/members: List members
router.get('/:id/members', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/workspaces/:id/members/:memberId/role: Change member role
router.patch('/:id/members/:memberId/role', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: any, res: any) => {
  const { id, memberId } = req.params;
  const { role } = req.body;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!member || member.workspaceId !== id) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (member.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot change an owner\'s role' });
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    const memberName = updated.user.name || updated.user.email;
    await logActivity(prisma, id, req.userId, 'member.role_changed', `Changed ${memberName}'s role to ${role}`);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workspaces/:id/members/:memberId: Remove member
router.delete('/:id/members/:memberId', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: any, res: any) => {
  const { id, memberId } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { name: true, email: true } } }
    });
    if (!member || member.workspaceId !== id) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (member.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot remove the workspace owner' });
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });

    const memberName = member.user.name || member.user.email;
    await logActivity(prisma, id, req.userId, 'member.removed', `Removed ${memberName} from workspace`);

    res.json({ success: true });
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email,
        role: role || 'MEMBER',
        token,
        expiresAt
      }
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'https://socialflow-saas.vercel.app'}/accept-invite?token=${token}`;

    if (!resend) {
      console.warn('RESEND_API_KEY not set — skipping invite email');
    } else {
      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: "You've been invited to join a workspace on SocialFlow",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>You're Invited!</h2>
              <p>You have been invited to join a workspace on SocialFlow with the role of <strong>${role || 'MEMBER'}</strong>.</p>
              <p>Click the button below to accept the invitation:</p>
              <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #6d28d9; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;">Accept Invitation</a>
              <p style="margin-top: 20px; font-size: 12px; color: #888;">If the button doesn't work, copy and paste this link into your browser: <br>${inviteLink}</p>
            </div>
          `,
        });
        console.log(`Invite email successfully sent to ${email} via Resend`);
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError);
      }
    }

    await logActivity(prisma, id, req.userId, 'member.invited', `Invited ${email} as ${role || 'MEMBER'}`);

    res.status(201).json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id/invites: List pending invites
router.get('/:id/invites', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: any, res: any) => {
  const { id } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workspaces/:id/invites/:inviteId: Cancel invite
router.delete('/:id/invites/:inviteId', requireAuth, requireRole(['OWNER', 'ADMIN']), async (req: any, res: any) => {
  const { id, inviteId } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.workspaceId !== id) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    await prisma.workspaceInvite.delete({ where: { id: inviteId } });

    await logActivity(prisma, id, req.userId, 'invite.cancelled', `Cancelled invite for ${invite.email}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id/activity: Activity log
router.get('/:id/activity', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const activities = await prisma.activityLog.findMany({
      where: { workspaceId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id/limits: Plan limits for workspace
router.get('/:id/limits', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  if (req.workspaceId !== id) {
    return res.status(403).json({ error: 'Not authorized for this workspace' });
  }

  try {
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const planName = (workspace.plan as keyof typeof PLAN_LIMITS) || 'STARTER';
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.STARTER;

    const [memberCount, channelCount] = await Promise.all([
      prisma.workspaceMember.count({ where: { workspaceId: id } }),
      prisma.socialAccount.count({ where: { workspaceId: id } })
    ]);

    res.json({
      plan: planName,
      limits: {
        members: limits.members === -1 ? Infinity : limits.members,
        channels: limits.channels === -1 ? Infinity : limits.channels
      },
      usage: {
        members: memberCount,
        channels: channelCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PLAN_LIMITS: Record<string, { workspaces: number; channels: number; members: number }> = {
  STARTER: { workspaces: 1, channels: 3, members: 1 },
  PRO: { workspaces: 3, channels: 10, members: 5 },
  ENTERPRISE: { workspaces: -1, channels: -1, members: -1 },
};

async function logActivity(prisma: PrismaClient, workspaceId: string, userId: string, action: string, details?: string) {
  try {
    await prisma.activityLog.create({
      data: { workspaceId, userId, action, details }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export default router;
