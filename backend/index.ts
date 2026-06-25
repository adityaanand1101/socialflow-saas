import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';
import { users } from '@clerk/clerk-sdk-node';
import oauthRouter from './routes/oauth';
import postsRouter from './routes/posts';
import aiRouter from './routes/ai';
import mediaRouter from './routes/media';
import workspacesRouter from './routes/workspaces';
import invitesRouter from './routes/invites';
import razorpayRouter from './routes/razorpay';
import integrationsRouter from './routes/integrations';
import externalApiRouter from './routes/externalApi';
import channelsRouter from './routes/channels';
import notificationsRouter from './routes/notifications';
import tagsRouter from './routes/tags';
import shortlinksRouter from './routes/shortlinks';
import webhooksRouter from './routes/webhooks';
import uploadsRouter from './routes/uploads';
import analyticsRouter from './routes/analytics';
import inboxRouter from './routes/inbox';
import { requireAuth } from './middlewares/auth';
import { startRecoverySweep } from './utils/queue';

dotenv.config();

export const app = express();
const prisma = new PrismaClient();

// 1. Basic Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://socialflow-saas.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for easier initial deployment
}));
app.use(cookieParser());

// 2. Health check (Priority)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Diagnostics (Temporary Public Route for Setup)
app.get('/api/diagnostics', async (req, res) => {
  const checkEnv = (key: string) => {
    const val = process.env[key];
    if (!val) return '❌ MISSING';
    if (val.includes('your_') || val.includes('placeholder')) return `⚠️ PLACEHOLDER (${val.substring(0, 4)}...)`;
    return `✅ CONFIGURED (${val.substring(0, 4)}...)`;
  };

  let dbStats = { users: 0, workspaces: 0, aiLogs: 0, lastLogs: [], error: null };
  try {
    const [userCount, workspaceCount, aiLogCount, lastLogs] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.aiGenerationLog.count(),
      prisma.aiGenerationLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
    ]);
    dbStats.users = userCount;
    dbStats.workspaces = workspaceCount;
    dbStats.aiLogs = aiLogCount;
    dbStats.lastLogs = lastLogs as any;
  } catch (e: any) {
    dbStats.error = e.message;
  }

  const report = {
    database_stats: dbStats,
    auth: {
      CLERK_SECRET_KEY: checkEnv('CLERK_SECRET_KEY'),
      CLERK_PUBLISHABLE_KEY: checkEnv('CLERK_PUBLISHABLE_KEY'),
      CLERK_WEBHOOK_SECRET: checkEnv('CLERK_WEBHOOK_SECRET'),
    },
    social_apis: {
      X_ID: checkEnv('X_CLIENT_ID'),
      INSTAGRAM_ID: checkEnv('INSTAGRAM_CLIENT_ID'),
    }
  };

  res.json(report);
});

// 3. Webhook (Hardened with Try/Catch)
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!SIGNING_SECRET) return res.status(500).json({ error: 'Webhook secret missing' });

    const payload = req.body.toString();
    const headers = req.headers as Record<string, string>;
    const wh = new Webhook(SIGNING_SECRET);
    
    const evt: any = wh.verify(payload, {
      'svix-id': headers['svix-id'] as string,
      'svix-timestamp': headers['svix-timestamp'] as string,
      'svix-signature': headers['svix-signature'] as string,
    });

    if (evt.type === 'user.created') {
      const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      const user = await prisma.user.create({
        data: { clerkId, email, name, avatarUrl: image_url },
      });
      const workspace = await prisma.workspace.create({
        data: { name: `${name}'s Workspace`, slug: `workspace-${user.id}`, plan: 'PRO' },
      });
      await prisma.workspaceMember.create({
        data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
      });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
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
app.use('/api/channels', channelsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/shortlinks', shortlinksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/inbox', inboxRouter);

app.get('/api/user/me', requireAuth, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { memberships: { include: { workspace: true } } }
    });
    res.json(user || { error: 'User not found' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Static Assets & Catch-all (Hardened)
const distPath = path.join(__dirname, '../../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  console.warn('WARNING: Frontend dist folder not found at:', distPath);
}

// Final Catch-all handler (Express 5 safe middleware)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built or API route not found');
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);

// Only start the server when this file is run directly, not when imported for tests
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Startup] Attempting to start server on port ${PORT} and binding to 0.0.0.0...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Startup] Server is successfully running on port ${PORT}`);
      
      // Start recovery sweep for stuck posts
      startRecoverySweep(5 * 60 * 1000);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('[Shutdown] Received signal, closing server...');
      server.close(() => {
        console.log('[Shutdown] Server closed');
        process.exit(0);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

export default app;
