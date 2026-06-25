import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth';
import { syncCommentsForAccount, replyToPlatformComment } from '../utils/publishers/comments';
import { decryptToken } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

// GET /api/inbox/comments — fetch comments from DB (and optionally sync from platforms)
router.get('/comments', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(400).json({ error: 'No workspace selected' });

    const { sync } = req.query;

    // If sync=true, pull latest comments from each connected social account
    if (sync === 'true') {
      const accounts = await prisma.socialAccount.findMany({
        where: { workspaceId },
      });

      await Promise.allSettled(
        accounts.map(acc => syncCommentsForAccount(workspaceId, acc.id))
      );
    }

    const comments = await prisma.comment.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const result = comments.map(c => ({
      id: c.id,
      platform: c.platform.toLowerCase(),
      fromName: c.fromName,
      fromUsername: c.fromUsername,
      fromAvatar: c.fromAvatar,
      content: c.content,
      postId: c.externalPostId,
      postCaption: null,
      timestamp: c.timestamp.toISOString(),
      isRead: c.isRead,
    }));

    res.json(result);
  } catch (err: any) {
    console.error('[inbox] GET /comments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inbox/comments/:id/reply — reply to a comment on the platform
router.post('/comments/:id/reply', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const comment = await prisma.comment.findUnique({
      where: { id: id as string },
      include: { socialAccount: true },
    });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    let token: string;
    try {
      token = decryptToken(comment.socialAccount.accessToken || '', ENCRYPTION_KEY);
    } catch {
      token = comment.socialAccount.accessToken || '';
    }

    await replyToPlatformComment(
      comment.platform,
      token,
      comment.externalPostId,
      comment.externalId,
      content,
    );

    const replyComment = await prisma.comment.create({
      data: {
        workspaceId: comment.workspaceId,
        socialAccountId: comment.socialAccountId,
        platform: comment.platform,
        externalId: `reply_${Date.now()}`,
        externalPostId: comment.externalPostId,
        fromName: comment.socialAccount.displayName || comment.socialAccount.username,
        fromUsername: comment.socialAccount.username,
        fromAvatar: comment.socialAccount.avatarUrl,
        content,
        timestamp: new Date(),
      },
    });

    res.json({ success: true, reply: { id: replyComment.id, content, timestamp: replyComment.timestamp.toISOString() } });
  } catch (err: any) {
    console.error('[inbox] POST /comments/:id/reply error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inbox/comments/:id/read — mark comment as read
router.patch('/comments/:id/read', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    await prisma.comment.update({
      where: { id: id as string },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[inbox] PATCH /comments/:id/read error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
