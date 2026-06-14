import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
import integrationsRouter from './routes/integrations';
import externalApiRouter from './routes/externalApi';
import { requireAuth } from './middlewares/auth';

dotenv.config();

export const app = express();
const prisma = new PrismaClient();

// 1. Basic Middlewares
app.use(cors());
app.use(helmet());

// 2. Health check (Lightweight for pings)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Webhook (Needs raw body)
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!SIGNING_SECRET) return res.status(500).json({ error: 'Webhook secret missing' });

  const payload = req.body.toString();
  const headers = req.headers as Record<string, string>;
  const wh = new Webhook(SIGNING_SECRET);
  
  try {
    const evt: any = wh.verify(payload, {
      'svix-id': headers['svix-id'] as string,
      'svix-timestamp': headers['svix-timestamp'] as string,
      'svix-signature': headers['svix-signature'] as string,
    });

    if (evt.type === 'user.created') {
      const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      await prisma.user.create({
        data: { clerkId, email, name, avatarUrl: image_url },
      });
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (user) {
        const workspace = await prisma.workspace.create({
          data: { name: `${name}'s Workspace`, slug: `workspace-${user.id}` },
        });
        await prisma.workspaceMember.create({
          data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
        });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. API Routes (JSON only)
app.use(express.json());

app.use('/api/oauth', oauthRouter);
app.use('/api/posts', postsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/media', mediaRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/razorpay', razorpayRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/external', externalApiRouter);

app.get('/api/user/me', requireAuth, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { memberships: { include: { workspace: true } } }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Static Assets & Catch-all (Consolidated App)
// In production, index.js is in backend/dist. Root dist is at ../../dist
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Final Catch-all handler for SPA (Express 5 safe - NO WILDCARD)
app.get('/:path*', (req, res, next) => {
  // If request is for an API that doesn't exist, return 404 via next()
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  // Otherwise serve index.html for React Router
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
