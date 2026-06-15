import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import { checkSaaSLimits, requireRole } from '../middlewares/limits';
import crypto from 'crypto';
import { Resend } from 'resend';

const router = Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 're_AhZP9Wt8_LW2ZnJipTHaSt4RNDRpA3qT3');

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

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

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

    res.status(201).json(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
