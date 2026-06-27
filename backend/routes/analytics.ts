import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth';
import { fetchAnalyticsForAccount } from '../utils/analytics';
import { decryptToken } from '../utils/crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

const router = Router();
const prisma = new PrismaClient();

interface KpiMetric {
  total: number;
  growth: number;
}

interface AnalyticsResponse {
  platforms: any[];
  metrics: {
    followers: KpiMetric;
    engagements: KpiMetric;
    impressions: KpiMetric;
    linkClicks: KpiMetric;
    shares: KpiMetric;
  };
  timeline: Array<Record<string, any>>;
  platformDistribution: Array<{ name: string; value: number }>;
  topPosts: any[];
}

// GET /api/analytics — get aggregated analytics for the workspace
router.get('/', requireAuth, async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // 1. Get all connected social accounts
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { workspaceId },
    });

    // 2. Separate API-connected accounts (have tokens) from MANUAL accounts (no tokens)
    const apiAccounts = socialAccounts.filter(acct => acct.accessToken);
    const manualAccounts = socialAccounts.filter(acct => !acct.accessToken);

    // 3. Fetch analytics for API accounts in parallel (decrypting tokens first)
    const platformResults = await Promise.allSettled(
        apiAccounts.map(acct => {
          let token: string = acct.accessToken!;
          try {
            token = decryptToken(token, ENCRYPTION_KEY);
          } catch (e) {
            console.warn(`[analytics] Token decryption failed for ${acct.platform} account ${acct.id}:`, (e as Error).message);
            return Promise.resolve({
              platform: acct.platform.toLowerCase(),
              accountId: acct.platformAccountId!,
              accountName: acct.displayName || acct.username,
              avatarUrl: acct.avatarUrl,
              followers: 0, following: 0, postsCount: 0,
              engagement: 0, impressions: 0, reach: 0, profileViews: 0,
              error: 'Token decryption failed — re-connect this account',
            });
          }
          return fetchAnalyticsForAccount(
            acct.platform.toLowerCase(),
            token,
            acct.platformAccountId!,
            acct.username,
            acct.displayName || undefined,
            acct.avatarUrl || undefined,
          );
        }),
    );

    const platforms: any[] = [];
    for (const result of platformResults) {
      if (result.status === 'fulfilled') {
        if (result.value.avatarUrl?.includes('shadcn.png')) {
          result.value.avatarUrl = undefined;
        }
        platforms.push(result.value);
      } else {
        console.warn('[analytics] A platform fetch rejected unexpectedly:', result.reason);
      }
    }

    // 4. Add stub entries for MANUAL accounts (so they still appear in the breakdown)
    for (const acct of manualAccounts) {
      platforms.push({
        platform: acct.platform.toLowerCase(),
        accountId: acct.platformAccountId || acct.id,
        accountName: acct.manualDisplayName || acct.displayName || acct.manualHandle || acct.username,
        avatarUrl: acct.manualAvatarUrl || acct.avatarUrl,
        followers: 0, following: 0, postsCount: 0,
        engagement: 0, impressions: 0, reach: 0, profileViews: 0,
        error: 'Analytics unavailable for manual connections',
      });
    }

    // 5. Compute aggregated metrics
    let totalFollowers = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    for (const p of platforms) {
      totalFollowers += p.followers || 0;
      totalImpressions += p.impressions || 0;
      totalEngagement += p.engagement || 0;
    }

    // 6. Compute platform distribution (for pie chart)
    const platformDistribution = platforms
      .filter(p => p.followers > 0)
      .map(p => ({
        name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
        value: p.followers,
      }));

    // 7. Build timeline data from posts
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPosts = await prisma.post.findMany({
      where: {
        workspaceId,
        createdAt: { gte: thirtyDaysAgo },
        status: 'PUBLISHED',
      },
      include: {
        accounts: { include: { socialAccount: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date and platform
    const timelineMap = new Map<string, Record<string, number>>();
    for (const post of recentPosts) {
      const day = post.createdAt.toISOString().slice(0, 10);
      const entry = timelineMap.get(day) || {};
      for (const acctPost of post.accounts) {
        const platform = acctPost.socialAccount.platform.toLowerCase();
        entry[platform] = (entry[platform] || 0) + 1;
      }
      entry['_count'] = (entry['_count'] || 0) + 1;
      timelineMap.set(day, entry);
    }

    const timeline = Array.from(timelineMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        name: date,
        ...counts,
      }));

    // 8. Get top performing posts
    const publishedPosts = await prisma.post.findMany({
      where: { workspaceId, status: 'PUBLISHED' },
      include: {
        accounts: { include: { socialAccount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const topPosts = publishedPosts.slice(0, 10).map(post => {
      const text = post.content || '';
      const platformData = post.accounts[0]?.socialAccount;
      return {
        id: post.id,
        content: text.length > 80 ? text.slice(0, 80) + '...' : text,
        platform: platformData?.platform?.toLowerCase() || 'unknown',
        publishedAt: post.createdAt,
        reach: 0,
        engagement: 0,
        rate: '0%',
      };
    });

    // 9. Return the aggregated response
    const response: AnalyticsResponse = {
      platforms,
      metrics: {
        followers: { total: totalFollowers, growth: 0 },
        engagements: { total: totalEngagement, growth: 0 },
        impressions: { total: totalImpressions, growth: 0 },
        linkClicks: { total: 0, growth: 0 },
        shares: { total: 0, growth: 0 },
      },
      timeline,
      platformDistribution,
      topPosts,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
