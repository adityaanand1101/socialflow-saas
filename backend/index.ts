import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';
import { ClerkExpressRequireAuth, StrictAuthProp, users } from '@clerk/clerk-sdk-node';
import oauthRouter from './routes/oauth';
import postsRouter from './routes/posts';
import aiRouter from './routes/ai';
import mediaRouter from './routes/media';
import workspacesRouter from './routes/workspaces';
import invitesRouter from './routes/invites';
import razorpayRouter from './routes/razorpay';
import { requireAuth } from './middlewares/auth';

dotenv.config();

export const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(helmet());

// Webhook endpoint needs raw body for svix signature verification
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add CLERK_WEBHOOK_SECRET to .env');
  }

  const payload = req.body.toString();
  const headers = req.headers as Record<string, string>;

  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' });
  }

  const wh = new Webhook(SIGNING_SECRET);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err: any) {
    console.error('Error verifying webhook:', err.message);
    return res.status(400).json({ error: err.message });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      const user = await prisma.user.create({
        data: { clerkId, email, name, avatarUrl: image_url },
      });
      const workspace = await prisma.workspace.create({
        data: { name: `${name}'s Workspace`, slug: `workspace-${user.id}` },
      });
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create user/workspace' });
    }
  } else if (eventType === 'user.updated') {
    const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      await prisma.user.update({
        where: { clerkId },
        data: { email, name, avatarUrl: image_url },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
  } else if (eventType === 'user.deleted') {
    const { id: clerkId } = evt.data;
    try {
      await prisma.user.delete({ where: { clerkId } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  res.status(200).json({ success: true });
});

// Use JSON body parser for all other routes
app.use(express.json());

// Extend express Request to include custom fields
declare global {
  namespace Express {
    interface Request extends StrictAuthProp {
      userId?: string;
      dbUser?: any;
      workspaceId?: string | null;
      workspaceRole?: string | null;
    }
  }
}

app.use('/api/oauth', oauthRouter);
app.use('/api/posts', postsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/media', mediaRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/razorpay', razorpayRouter);

// User Profile Management Routes
app.get('/api/user/me', requireAuth, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { memberships: { include: { workspace: true } } }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/user/me', requireAuth, async (req: any, res: any) => {
  const { name, avatarUrl } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, avatarUrl },
    });

    // Sync back to Clerk if configured
    try {
      const clerkId = req.auth.userId;
      if (clerkId && process.env.CLERK_SECRET_KEY) {
        const nameParts = (name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await users.updateUser(clerkId, {
          firstName,
          lastName,
          ...(avatarUrl ? { imageUrl: avatarUrl } : {})
        });
      }
    } catch (clerkErr) {
      console.warn('Failed to sync profile update back to Clerk:', clerkErr);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

