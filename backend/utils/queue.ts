import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { decryptToken, encryptToken } from './crypto';
import fetch from 'node-fetch';
import { triggerWebhooks } from './webhooks';
import { checkRateLimit, publishWithTokenRefresh } from './publishers/common';

const redisUrl = process.env.REDIS_URL;
const connection = redisUrl ? new IORedis(redisUrl, { maxRetriesPerRequest: null }) : new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});
connection.on('error', (err) => {
  console.warn('Redis connection error. BullMQ tasks will not work.', err.message);
});

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
if (!ENCRYPTION_KEY) {
  console.error('CRITICAL: ENCRYPTION_KEY not set — queue token decryption will fail');
}

let postQueue: any;
let postWorker: any;

async function refreshSocialAccountToken(account: any) {
  const platformKey = account.platform.toLowerCase();

  // Threads uses th_exchange_token (no refresh_token returned by the API).
  if (platformKey === 'threads') {
    if (!account.tokenExpiresAt) return decryptToken(account.accessToken, ENCRYPTION_KEY);
    const expiresAt = new Date(account.tokenExpiresAt);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (expiresAt > sevenDaysFromNow) return decryptToken(account.accessToken, ENCRYPTION_KEY);

    try {
      const currentToken = decryptToken(account.accessToken, ENCRYPTION_KEY);
      const clientSecret = process.env.THREADS_CLIENT_SECRET || '';
      const refreshUrl = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(currentToken)}`;
      const res = await fetch(refreshUrl);
      if (!res.ok) throw new Error(`Threads token refresh failed: ${await res.text()}`);
      const data = await res.json() as any;
      const newToken = data.access_token;
      if (!newToken) throw new Error('No access_token in Threads refresh response');
      const expiresIn = data.expires_in || 5184000;
      const encrypted = encryptToken(newToken, ENCRYPTION_KEY);
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000);
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { accessToken: encrypted, tokenExpiresAt: newExpiresAt }
      });
      return newToken;
    } catch (err) {
      console.error(`Error refreshing Threads token:`, err);
      return decryptToken(account.accessToken, ENCRYPTION_KEY);
    }
  }

  if (!account.refreshToken || !account.tokenExpiresAt || new Date(account.tokenExpiresAt) > new Date()) {
    return decryptToken(account.accessToken, ENCRYPTION_KEY);
  }

  const providerUrls: Record<string, string> = {
    linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
    x: 'https://api.twitter.com/2/oauth2/token',
    instagram: 'https://api.instagram.com/oauth/access_token',
    facebook: 'https://graph.facebook.com/v22.0/oauth/access_token',
    threads: 'https://graph.threads.net/oauth/access_token',
    youtube: 'https://oauth2.googleapis.com/token',
    pinterest: 'https://api.pinterest.com/v5/oauth/token',
    gmb: 'https://oauth2.googleapis.com/token',
    reddit: 'https://www.reddit.com/api/v1/access_token',
    tumblr: 'https://api.tumblr.com/v2/oauth2/token',
    discord: 'https://discord.com/api/oauth2/token',
    slack: 'https://slack.com/api/oauth.v2.access'
  };

  const clientIds: Record<string, string> = {
    linkedin: process.env.LINKEDIN_CLIENT_ID || '',
    x: process.env.X_CLIENT_ID || '',
    instagram: process.env.INSTAGRAM_CLIENT_ID || '',
    facebook: process.env.FACEBOOK_CLIENT_ID || '',
    threads: process.env.THREADS_CLIENT_ID || '',
    youtube: process.env.YOUTUBE_CLIENT_ID || '',
    pinterest: process.env.PINTEREST_CLIENT_ID || '',
    gmb: process.env.GMB_CLIENT_ID || '',
    reddit: process.env.REDDIT_CLIENT_ID || '',
    tumblr: process.env.TUMBLR_CLIENT_ID || '',
    discord: process.env.DISCORD_CLIENT_ID || '',
    slack: process.env.SLACK_CLIENT_ID || ''
  };

  const clientSecrets: Record<string, string> = {
    linkedin: process.env.LINKEDIN_CLIENT_SECRET || '',
    x: process.env.X_CLIENT_SECRET || '',
    instagram: process.env.INSTAGRAM_CLIENT_SECRET || '',
    facebook: process.env.FACEBOOK_CLIENT_SECRET || '',
    threads: process.env.THREADS_CLIENT_SECRET || '',
    youtube: process.env.YOUTUBE_CLIENT_SECRET || '',
    pinterest: process.env.PINTEREST_CLIENT_SECRET || '',
    gmb: process.env.GMB_CLIENT_SECRET || '',
    reddit: process.env.REDDIT_CLIENT_SECRET || '',
    tumblr: process.env.TUMBLR_CLIENT_SECRET || '',
    discord: process.env.DISCORD_CLIENT_SECRET || '',
    slack: process.env.SLACK_CLIENT_SECRET || ''
  };

  const tokenUrl = providerUrls[platformKey];
  const clientId = clientIds[platformKey];
  const clientSecret = clientSecrets[platformKey];

  if (!tokenUrl || !clientId || !clientSecret) {
    console.warn(`Cannot refresh token for ${account.platform}: Missing credentials.`);
    return decryptToken(account.accessToken, ENCRYPTION_KEY);
  }

  try {
    const decryptedRefresh = decryptToken(account.refreshToken, ENCRYPTION_KEY);

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', decryptedRefresh);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      throw new Error(`Failed to refresh token: ${await res.text()}`);
    }

    const data = await res.json() as any;
    const newAccessToken = data.access_token || data.accessToken;
    const newRefreshToken = data.refresh_token || data.refreshToken || decryptedRefresh;
    const expiresIn = data.expires_in || 3600;

    const encryptedAccess = encryptToken(newAccessToken, ENCRYPTION_KEY);
    const encryptedRefresh = encryptToken(newRefreshToken, ENCRYPTION_KEY);
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: newExpiresAt
      }
    });

    return newAccessToken;
  } catch (err) {
    console.error(`Error refreshing token for ${account.platform}:`, err);
    return decryptToken(account.accessToken, ENCRYPTION_KEY);
  }
}

async function publishToPlatform(platform: string, decryptedToken: string, content: string, mediaUrls: string[]) {
  // The account's platform-specific ID (e.g., IG user ID, Facebook page ID, etc.)
  // is stored in the junction table; we include it from the calling code.
  // This function is maintained for backward compatibility — the real dispatch
  // is handled by the publishers module, which receives platformAccountId separately.
  throw new Error(`Publishing logic for ${platform} is not yet implemented.`);
}

try {
  postQueue = new Queue('post-publishing', { 
    connection: connection as any,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: 20,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  });

  postWorker = new Worker('post-publishing', async (job: Job) => {
    const { postId } = job.data;
    console.log(`Processing job ${job.id} for post ${postId}`);

    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { accounts: { include: { socialAccount: true } } }
      });

      if (!post) {
        console.warn(`Post ${postId} not found, skipping.`);
        return;
      }

      await prisma.post.update({
        where: { id: postId },
        data: { status: 'PUBLISHING' }
      });

      await prisma.socialAccountPost.updateMany({
        where: { postId: post.id },
        data: { status: 'PUBLISHING' }
      });

      let overallSuccess = true;
      let failureCount = 0;

      for (const accountPost of post.accounts) {
        const account = accountPost.socialAccount;
        const platform = account.platform.toLowerCase();
        try {
          // Apply per-platform rate limiting
          await checkRateLimit(platform);

          // Import is hoisted — call the real publisher from the publishers module
          const { publishToPlatform: realPublish } = await import('./publishers');

          const result = await publishWithTokenRefresh(
            (token: string) => realPublish(
              platform,
              token,
              post.content || '',
              post.mediaUrls,
              account.platformAccountId,
              (post.structuredContent as Record<string, Record<string, string>> | undefined),
              (post.postTypes as Record<string, string> | undefined),
            ),
            () => refreshSocialAccountToken(account),
            { platform, accountId: account.id }
          );

          await prisma.socialAccountPost.update({
            where: {
              postId_socialAccountId: {
                postId: post.id,
                socialAccountId: account.id
              }
            },
            data: {
              status: 'PUBLISHED',
              publishedUrl: result.url || null,
              publishedAt: new Date()
            }
          });
        } catch (postErr: any) {
          console.error(`Failed to publish to platform ${account.platform}:`, postErr.message);
          overallSuccess = false;
          failureCount++;

          await prisma.socialAccountPost.update({
            where: {
              postId_socialAccountId: {
                postId: post.id,
                socialAccountId: account.id
              }
            },
            data: {
              status: 'FAILED',
              errorMessage: postErr.message
            }
          });
        }
      }

      const postStatus = overallSuccess ? 'PUBLISHED' : (failureCount === post.accounts.length ? 'FAILED' : 'PUBLISHED'); 
      
      await prisma.post.update({
        where: { id: postId },
        data: { status: postStatus }
      });

      console.log(`Finished processing post ${postId}. Status: ${postStatus}`);

      // Fire outward webhook integrations
      if (postStatus === 'PUBLISHED') {
        await triggerWebhooks(post.workspaceId, 'post.published', { postId, successCount: post.accounts.length - failureCount });
      } else {
        await triggerWebhooks(post.workspaceId, 'post.failed', { postId, failureCount });
      }

    } catch (error) {
      console.error(`Queue job execution crashed for post ${postId}:`, error);
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
  }, { connection: connection as any });

  postWorker.on('error', (err: any) => {
    console.warn('Worker error:', err.message);
  });
} catch (error) {
  console.warn('Failed to initialize BullMQ:', (error as any).message);
}

/**
 * Recovery sweep: finds posts stuck in SCHEDULED/PUBLISHING past their scheduled time
 * and re-queues them for publishing.
 * 
 * This handles cases where:
 * - Worker crashed before processing
 * - Network issues prevented publishing
 * - Token refresh failed silently
 */
export async function runRecoverySweep(): Promise<number> {
  const now = new Date();
  const thresholdMinutes = 5; // only re-queue posts scheduled at least 5 minutes ago
  const cutoff = new Date(now.getTime() - thresholdMinutes * 60 * 1000);

  const stuckPosts = await prisma.post.findMany({
    where: {
      status: { in: ['SCHEDULED', 'PUBLISHING'] },
      scheduledAt: { lt: cutoff },
    },
    include: { accounts: { include: { socialAccount: true } } },
  });

  if (stuckPosts.length === 0) {
    console.log('[Recovery] No stuck posts found');
    return 0;
  }

  console.log(`[Recovery] Found ${stuckPosts.length} stuck post(s), re-queueing...`);

  let requeued = 0;
  for (const post of stuckPosts) {
    try {
      // Reset post status to SCHEDULED so worker picks it up
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'SCHEDULED' }
      });

      // Reset account post statuses
      await prisma.socialAccountPost.updateMany({
        where: { postId: post.id },
        data: { status: 'SCHEDULED', errorMessage: null }
      });

      // Re-add to queue
      await postQueue?.add('post-publishing', { postId: post.id }, {
        removeOnComplete: true,
        removeOnFail: 20,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      requeued++;
      console.log(`[Recovery] Re-queued post ${post.id}`);
    } catch (err) {
      console.error(`[Recovery] Failed to re-queue post ${post.id}:`, err);
    }
  }

  return requeued;
}

/**
 * Start the recovery sweep as a periodic job (every 5 minutes by default)
 */
export function startRecoverySweep(intervalMs = 5 * 60 * 1000) {
  console.log(`[Recovery] Starting periodic sweep every ${intervalMs / 60000} minutes`);
  
  // Run once immediately
  runRecoverySweep().catch(console.error);
  
  // Then run periodically
  const interval = setInterval(() => {
    runRecoverySweep().catch(console.error);
  }, intervalMs);

  return () => clearInterval(interval);
}

export { postQueue, postWorker };
