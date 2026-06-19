import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { postQueue } from '../utils/queue';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/posts: List all posts (paginated, with platforms)
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const { limit, offset } = req.query;
    const take = limit ? parseInt(limit as string, 10) : 50;
    const skip = offset ? parseInt(offset as string, 10) : 0;

    const posts = await prisma.post.findMany({
      where: { workspaceId },
      include: { accounts: { include: { socialAccount: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 100),
      skip,
    });

    const transformed = posts.map(p => ({
      id: p.id,
      userId: p.userId,
      workspaceId: p.workspaceId,
      content: p.content,
      caption: p.content,
      mediaUrls: p.mediaUrls,
      media: p.mediaUrls,
      platforms: p.accounts.map(a => a.socialAccount.platform.toLowerCase()),
      scheduledAt: p.scheduledAt,
      scheduledTime: p.scheduledAt?.toISOString(),
      status: p.status.toLowerCase(),
      tags: [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      accounts: p.accounts,
    }));

    const total = await prisma.post.count({ where: { workspaceId } });

    res.json({ posts: transformed, total, limit: take, offset: skip });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts: Create a new post
router.post('/', requireAuth, async (req: any, res: any) => {
  const { content, mediaUrls, socialAccountIds, scheduledAt, status } = req.body;

  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const postStatus = status || (scheduledAt ? 'SCHEDULED' : 'DRAFT');

    const newPost = await prisma.post.create({
      data: {
        userId: req.userId,
        workspaceId,
        content,
        mediaUrls: mediaUrls || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: postStatus,
        accounts: {
          create: (socialAccountIds || []).map((accountId: string) => ({
            socialAccountId: accountId,
            status: postStatus
          }))
        }
      },
      include: { accounts: { include: { socialAccount: true } } }
    });

    // If scheduled, add to BullMQ with jobId = postId to allow cancellation/rescheduling
    if (postStatus === 'SCHEDULED' && scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      try {
        // Remove existing job just in case
        const existingJob = await postQueue.getJob(newPost.id);
        if (existingJob) await existingJob.remove();

        await postQueue.add(
          'publish-post',
          { postId: newPost.id },
          { jobId: newPost.id, delay: Math.max(0, delay) }
        );
      } catch (queueErr: any) {
        console.warn('Failed to add scheduled job to queue:', queueErr.message);
      }
    }

    res.status(201).json({
      ...newPost,
      caption: newPost.content,
      media: newPost.mediaUrls,
      platforms: newPost.accounts.map(a => a.socialAccount?.platform?.toLowerCase()).filter(Boolean),
      scheduledTime: newPost.scheduledAt?.toISOString(),
      tags: [],
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/posts/:id: Update content, media, target accounts, or reschedule
router.patch('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const { content, mediaUrls, socialAccountIds, scheduledAt, status } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id }, include: { accounts: { include: { socialAccount: true } } } });
    if (!post || post.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postStatus = status || (scheduledAt ? 'SCHEDULED' : post.status);

    const updateData: any = {
      ...(content !== undefined && { content }),
      ...(mediaUrls !== undefined && { mediaUrls }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      status: postStatus,
    };

    // If socialAccountIds provided, replace the junction table records
    if (socialAccountIds !== undefined) {
      await prisma.socialAccountPost.deleteMany({ where: { postId: id } });
      updateData.accounts = {
        create: socialAccountIds.map((accountId: string) => ({
          socialAccountId: accountId,
          status: postStatus
        }))
      };
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: { accounts: { include: { socialAccount: true } } }
    });

    // Handle rescheduling/queue job updates
    try {
      const existingJob = await postQueue.getJob(id);
      if (existingJob) {
        await existingJob.remove();
      }
    } catch (err: any) {
      console.warn('Failed to remove old queue job:', err.message);
    }

    if (postStatus === 'SCHEDULED' && scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      try {
        await postQueue.add(
          'publish-post',
          { postId: updatedPost.id },
          { jobId: updatedPost.id, delay: Math.max(0, delay) }
        );
      } catch (err: any) {
        console.warn('Failed to add rescheduled job to queue:', err.message);
      }
    }

    res.json({
      ...updatedPost,
      caption: updatedPost.content,
      media: updatedPost.mediaUrls,
      platforms: updatedPost.accounts.map((a: any) => a.socialAccount?.platform?.toLowerCase()).filter(Boolean),
      scheduledTime: updatedPost.scheduledAt?.toISOString(),
      tags: [],
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:id: Delete a post and its scheduled job
router.delete('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Cancel scheduled queue job
    try {
      const existingJob = await postQueue.getJob(id);
      if (existingJob) {
        await existingJob.remove();
      }
    } catch (err: any) {
      console.warn('Failed to remove queue job on post deletion:', err.message);
    }

    await prisma.post.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/publish: Publish post immediately
router.post('/:id/publish', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.post.update({
      where: { id },
      data: { status: 'PUBLISHING' }
    });

    // Cancel existing scheduled job if any
    try {
      const existingJob = await postQueue.getJob(id);
      if (existingJob) {
        await existingJob.remove();
      }
    } catch (err: any) {
      console.warn('Failed to remove scheduled job for immediate publishing:', err.message);
    }

    // Add to queue with 0 delay
    await postQueue.add('publish-post', { postId: id }, { jobId: id, delay: 0 });

    res.json({ success: true, message: 'Post queued for immediate publishing.' });
  } catch (error) {
    console.error('Error queuing post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;













