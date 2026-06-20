import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

// GET /api/webhooks - List webhook endpoints
router.get('/', async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    // Mask secrets in response
    const safeEndpoints = endpoints.map(e => ({
      ...e,
      secret: e.secret ? '***' : undefined
    }));

    res.json(safeEndpoints);
  } catch (err: any) {
    console.error('Error fetching webhooks:', err);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// POST /api/webhooks - Create webhook endpoint
router.post('/', async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const { url, events } = req.body as { url: string; events: string[] };

    if (!url || !events || !events.length) {
      return res.status(400).json({ error: 'url and events are required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        workspaceId,
        url,
        secret,
        events: events as any,
        isActive: true
      }
    });

    res.status(201).json({
      ...endpoint,
      secret // Return secret only once on creation
    });
  } catch (err: any) {
    console.error('Error creating webhook:', err);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// PATCH /api/webhooks/:id - Update webhook endpoint
router.patch('/:id', async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const { id } = req.params;
    const { url, events, isActive } = req.body;

    const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint || endpoint.workspaceId !== workspaceId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const updateData: any = {};
    if (url !== undefined) {
      try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL format' }); }
      updateData.url = url;
    }
    if (events !== undefined) updateData.events = events as any;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.webhookEndpoint.update({
      where: { id },
      data: updateData
    });

    res.json({ ...updated, secret: '***' });
  } catch (err: any) {
    console.error('Error updating webhook:', err);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// DELETE /api/webhooks/:id - Delete webhook endpoint
router.delete('/:id', async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const { id } = req.params;

    const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint || endpoint.workspaceId !== workspaceId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await prisma.webhookEndpoint.delete({ where: { id } });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting webhook:', err);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// POST /api/webhooks/:id/test - Send test payload
router.post('/:id/test', async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const { id } = req.params;

    const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint || endpoint.workspaceId !== workspaceId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from SocialFlow' }
    };

    const bodyString = JSON.stringify(testPayload);
    const signature = crypto.createHmac('sha256', endpoint.secret).update(bodyString).digest('hex');

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SocialFlow-Webhook-System',
        'x-socialflow-signature': signature
      },
      body: bodyString
    });

    await prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: { lastTriggeredAt: new Date() }
    });

    res.json({ success: response.ok, status: response.status });
  } catch (err: any) {
    console.error('Error testing webhook:', err);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

export default router;