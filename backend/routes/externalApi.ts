import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { postQueue } from '../utils/queue';

const router = Router();
const prisma = new PrismaClient();

// Middleware to verify the API key
const verifyApiKey = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer sf_live_')) {
    return res.status(401).json({ error: 'Unauthorized. Invalid API Key format.' });
  }

  const key = authHeader.split(' ')[1];

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { workspace: true }
    });

    if (!apiKey) {
      return res.status(401).json({ error: 'Unauthorized. API Key not found.' });
    }

    // Update last used timestamp (async, no need to await)
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(console.error);

    req.workspaceId = apiKey.workspaceId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// EXTERNAL INBOUND API (Used by Zapier/Make)
// ==========================================

// Create a new post via API
router.post('/posts', verifyApiKey, async (req: any, res: any) => {
  const { content, mediaUrls, platforms, scheduledAt } = req.body;
  
  if (!content) return res.status(400).json({ error: 'Content is required' });
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'At least one platform is required' });
  }

  try {
    const workspaceId = req.workspaceId;

    // Find active social accounts for this workspace that match the requested platforms
    const activeAccounts = await prisma.socialAccount.findMany({
      where: {
        workspaceId,
        platform: { in: platforms.map(p => p.toUpperCase()) }
      }
    });

    if (activeAccounts.length === 0) {
      return res.status(400).json({ error: 'No connected social accounts found for the specified platforms.' });
    }

    // Get an admin user ID for the workspace to attribute the post to
    const adminMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, role: { in: ['OWNER', 'ADMIN'] } }
    });

    if (!adminMember) {
      return res.status(400).json({ error: 'No valid user found to attribute this post to.' });
    }

    const post = await prisma.post.create({
      data: {
        workspaceId,
        userId: adminMember.userId,
        content,
        mediaUrls: mediaUrls || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT'
      }
    });

    // Link the post to the specific social accounts
    for (const account of activeAccounts) {
      await prisma.socialAccountPost.create({
        data: {
          postId: post.id,
          socialAccountId: account.id,
          status: post.status
        }
      });
    }

    // If scheduled for the past or no schedule, queue it immediately
    if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
      await postQueue.add('publish', { postId: post.id });
    } else {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      await postQueue.add('publish', { postId: post.id }, { delay });
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('External API Post Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics/status for a specific post
router.get('/posts/:id', verifyApiKey, async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId: req.workspaceId },
      include: {
        accounts: {
          include: { socialAccount: { select: { platform: true, username: true } } }
        }
      }
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
