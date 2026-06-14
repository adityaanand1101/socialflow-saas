import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// 1. API KEY MANAGEMENT (For Frontend UI)
// ==========================================

// List API Keys
router.get('/keys', requireAuth, async (req: any, res: any) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create API Key
router.post('/keys', requireAuth, async (req: any, res: any) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const key = `sf_live_${crypto.randomBytes(24).toString('hex')}`;
    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: req.workspaceId,
        name,
        key
      }
    });
    res.status(201).json(apiKey);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete API Key
router.delete('/keys/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await prisma.apiKey.deleteMany({
      where: { id, workspaceId: req.workspaceId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 2. WEBHOOK MANAGEMENT (For Frontend UI)
// ==========================================

// List Webhooks
router.get('/endpoints', requireAuth, async (req: any, res: any) => {
  try {
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { workspaceId: req.workspaceId }
    });
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Webhook
router.post('/endpoints', requireAuth, async (req: any, res: any) => {
  const { url, events } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;
    const webhook = await prisma.webhookEndpoint.create({
      data: {
        workspaceId: req.workspaceId,
        url,
        events: events || ['post.published', 'post.failed'],
        secret
      }
    });
    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Webhook
router.delete('/endpoints/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    await prisma.webhookEndpoint.deleteMany({
      where: { id, workspaceId: req.workspaceId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
