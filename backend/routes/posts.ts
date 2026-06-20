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
      include: { accounts: { include: { socialAccount: true } }, tags: { include: { tag: true } } },
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
      tags: p.tags?.map((pt: any) => pt.tag.name) || [],
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
  const { content, mediaUrls, socialAccountIds, scheduledAt, status, structuredContent, postTypes, tags } = req.body;

  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const postStatus = status || (scheduledAt ? 'SCHEDULED' : 'DRAFT');

    // Find or create tag IDs
    let tagConnect: any = undefined;
    if (tags && tags.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { name: { in: tags }, workspaceId }
      });
      const existingTagNames = new Set(existingTags.map(t => t.name));
      const newTagNames = tags.filter((t: string) => !existingTagNames.has(t));

      const createdTags = await Promise.all(
        newTagNames.map((name: string) => prisma.tag.create({ data: { name, workspaceId } }))
      );

      tagConnect = {
        create: [...existingTags, ...createdTags].map(tag => ({ tagId: tag.id }))
      };
    }

    const newPost = await prisma.post.create({
      data: {
        userId: req.userId,
        workspaceId,
        content,
        mediaUrls: mediaUrls || [],
        structuredContent: structuredContent || undefined,
        postTypes: postTypes || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: postStatus,
        accounts: {
          create: (socialAccountIds || []).map((accountId: string) => ({
            socialAccountId: accountId,
            status: postStatus
          }))
        },
        tags: tagConnect
      },
      include: { accounts: { include: { socialAccount: true } }, tags: { include: { tag: true } } }
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
      tags: newPost.tags?.map((pt: any) => pt.tag.name) || [],
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/posts/:id: Update content, media, target accounts, or reschedule
router.patch('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const { content, mediaUrls, socialAccountIds, scheduledAt, status, structuredContent, postTypes, tags } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id }, include: { accounts: { include: { socialAccount: true } }, tags: { include: { tag: true } } } });
    if (!post || post.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postStatus = status || (scheduledAt ? 'SCHEDULED' : post.status);

    const updateData: any = {
      ...(content !== undefined && { content }),
      ...(mediaUrls !== undefined && { mediaUrls }),
      ...(structuredContent !== undefined && { structuredContent }),
      ...(postTypes !== undefined && { postTypes }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      status: postStatus,
    };

    // Handle tags if provided
    if (tags !== undefined) {
      const existingTags = await prisma.tag.findMany({
        where: { name: { in: tags }, workspaceId: req.workspaceId }
      });
      const existingTagNames = new Set(existingTags.map(t => t.name));
      const newTagNames = tags.filter((t: string) => !existingTagNames.has(t));

      const createdTags = await Promise.all(
        newTagNames.map((name: string) => prisma.tag.create({ data: { name, workspaceId: req.workspaceId } }))
      );

      await prisma.postTag.deleteMany({ where: { postId: id } });
      updateData.tags = {
        create: [...existingTags, ...createdTags].map(tag => ({ tagId: tag.id }))
      };
    }

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

    const updatedPostWithTags = await prisma.post.findUnique({
      where: { id: updatedPost.id },
      include: { accounts: { include: { socialAccount: true } }, tags: { include: { tag: true } } }
    });
    
    res.json({
      ...updatedPost,
      caption: updatedPost.content,
      media: updatedPost.mediaUrls,
      platforms: updatedPost.accounts.map((a: any) => a.socialAccount?.platform?.toLowerCase()).filter(Boolean),
      scheduledTime: updatedPost.scheduledAt?.toISOString(),
      tags: updatedPostWithTags?.tags?.map((pt: any) => pt.tag.name) || [],
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













