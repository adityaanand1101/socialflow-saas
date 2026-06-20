import fetch from 'node-fetch';

const GRAPH_API = 'https://graph.facebook.com/v22.0';
const TWITTER_API = 'https://api.twitter.com/2';

export interface PlatformAnalytics {
  platform: string;
  accountId: string;
  accountName: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  postsCount: number;
  engagement: number;
  impressions: number;
  reach: number;
  profileViews: number;
  error?: string;
}

// ─── Instagram ──────────────────────────────────────────────────────────

async function fetchInstagram(
  token: string, platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'instagram',
    accountId: platformAccountId, accountName: displayName || username,
    avatarUrl, followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const [userRes, insightsRes] = await Promise.all([
      fetch(`${GRAPH_API}/${platformAccountId}?fields=followers_count,follows_count,media_count,profile_picture_url`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${GRAPH_API}/${platformAccountId}/insights?metric=impressions,reach,profile_views&period=day`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
    ]);

    if (userRes.ok) {
      const u = await userRes.json() as any;
      base.followers = u.followers_count ?? 0;
      base.following = u.follows_count ?? 0;
      base.postsCount = u.media_count ?? 0;
      if (u.profile_picture_url) base.avatarUrl = u.profile_picture_url;
    }

    if (insightsRes && insightsRes.ok) {
      const ins = await insightsRes.json() as any;
      for (const d of ins.data || []) {
        const v = d.values?.[d.values.length - 1]?.value ?? 0;
        if (d.name === 'impressions') base.impressions += v;
        if (d.name === 'reach') base.reach += v;
        if (d.name === 'profile_views') base.profileViews += v;
      }
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Facebook ───────────────────────────────────────────────────────────

async function fetchFacebook(
  token: string, platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'facebook', accountId: platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const pageRes = await fetch(
      `${GRAPH_API}/${platformAccountId}?fields=followers_count,fan_count,name,picture`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (pageRes.ok) {
      const p = await pageRes.json() as any;
      base.followers = p.fan_count ?? p.followers_count ?? 0;
      base.accountName = p.name || base.accountName;
      if (p.picture?.data?.url) base.avatarUrl = p.picture.data.url;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── X / Twitter ────────────────────────────────────────────────────────

async function fetchX(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'x', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const userRes = await fetch(
      `${TWITTER_API}/users/${_platformAccountId}?user.fields=public_metrics,profile_image_url,name`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (userRes.ok) {
      const d = await userRes.json() as any;
      const m = d.data?.public_metrics;
      base.followers = m?.followers_count ?? 0;
      base.following = m?.following_count ?? 0;
      base.postsCount = m?.tweet_count ?? 0;
      base.accountName = d.data?.name || base.accountName;
      if (d.data?.profile_image_url) base.avatarUrl = d.data.profile_image_url;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── LinkedIn ───────────────────────────────────────────────────────────

async function fetchLinkedIn(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'linkedin', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const meRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' },
    });
    if (meRes.ok) {
      const me = await meRes.json() as any;
      base.accountName = `${me.localizedFirstName || ''} ${me.localizedLastName || ''}`.trim() || base.accountName;
      if (me.profilePicture?.displayImage) {
        base.avatarUrl = `${me.profilePicture.displayImage}~?format=png`;
      }
    }

    const followersRes = await fetch(
      `https://api.linkedin.com/v2/networkSizes/${_platformAccountId}?edgeType=CompanyFollowedByMember`,
      { headers: { Authorization: `Bearer ${token}` } },
    ).catch(() => null);
    if (followersRes && followersRes.ok) {
      const f = await followersRes.json() as any;
      base.followers = f?.firstDegreeSize ?? 0;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── YouTube ────────────────────────────────────────────────────────────

async function fetchYouTube(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'youtube', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const channelRes = await fetch(
      `https://youtube.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${_platformAccountId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (channelRes.ok) {
      const d = await channelRes.json() as any;
      const item = d.items?.[0];
      if (item) {
        base.followers = parseInt(item.statistics?.subscriberCount) || 0;
        base.postsCount = parseInt(item.statistics?.videoCount) || 0;
        base.impressions = parseInt(item.statistics?.viewCount) || 0;
        base.accountName = item.snippet?.title || base.accountName;
        if (item.snippet?.thumbnails?.default?.url) base.avatarUrl = item.snippet.thumbnails.default.url;
      }
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Threads ────────────────────────────────────────────────────────────

async function fetchThreads(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'threads', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const userRes = await fetch(
      `${GRAPH_API}/${_platformAccountId}?fields=threads_profile_picture_url,threads_biography,username,name,followers_count,follows_count,media_count`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (userRes.ok) {
      const u = await userRes.json() as any;
      base.followers = u.followers_count ?? 0;
      base.following = u.follows_count ?? 0;
      base.postsCount = u.media_count ?? 0;
      if (u.name) base.accountName = u.name;
      if (u.threads_profile_picture_url) base.avatarUrl = u.threads_profile_picture_url;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Pinterest ──────────────────────────────────────────────────────────

async function fetchPinterest(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'pinterest', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (userRes.ok) {
      const u = await userRes.json() as any;
      base.accountName = u.username || base.accountName;
      if (u.profile_image) base.avatarUrl = u.profile_image;
    }
    const boardsRes = await fetch('https://api.pinterest.com/v5/boards?page_size=10', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (boardsRes.ok) {
      const b = await boardsRes.json() as any;

      const analyticsRes = await fetch('https://api.pinterest.com/v5/user_account/analytics?start_date=2000-01-01&end_date=2099-12-31', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (analyticsRes && analyticsRes.ok) {
        const a = await analyticsRes.json() as any;
        base.followers = a?.all?.follower_count ?? 0;
        base.impressions = a?.all?.pin_impression ?? 0;
      }
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Bluesky ────────────────────────────────────────────────────────────

async function fetchBluesky(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'bluesky', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const actor = username.startsWith('@') ? username.slice(1) : username;
    const profileRes = await fetch('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor }),
    });
    if (profileRes.ok) {
      const p = await profileRes.json() as any;
      base.followers = p.followersCount ?? 0;
      base.following = p.followsCount ?? 0;
      base.postsCount = p.postsCount ?? 0;
      base.accountName = p.displayName || base.accountName;
      if (p.avatar) base.avatarUrl = p.avatar;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Mastodon ───────────────────────────────────────────────────────────

async function fetchMastodon(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'mastodon', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const accountRes = await fetch(
      `https://mastodon.social/api/v1/accounts/${_platformAccountId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (accountRes.ok) {
      const a = await accountRes.json() as any;
      base.followers = a.followers_count ?? 0;
      base.following = a.following_count ?? 0;
      base.postsCount = a.statuses_count ?? 0;
      base.accountName = a.display_name || a.username || base.accountName;
      if (a.avatar) base.avatarUrl = a.avatar;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Reddit ─────────────────────────────────────────────────────────────

async function fetchReddit(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'reddit', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const aboutRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'SocialFlow/1.0' },
    });
    if (aboutRes.ok) {
      const m = await aboutRes.json() as any;
      base.accountName = m.name || base.accountName;
      base.followers = m.total_karma ?? 0;

      const meRes = await fetch(`https://oauth.reddit.com/user/${m.name}/about`, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'SocialFlow/1.0' },
      }).catch(() => null);
      if (meRes && meRes.ok) {
        const u = await meRes.json() as any;
        base.followers = u.data?.subscriber ?? base.followers;
        base.postsCount = (u.data?.total_karma ?? 0) + (m.comment_karma ?? 0);
      }
      base.postsCount = (m.link_karma ?? 0) + (m.comment_karma ?? 0);
      if (m.icon_img) base.avatarUrl = m.icon_img;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Telegram ───────────────────────────────────────────────────────────

async function fetchTelegram(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'telegram', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const chat = _platformAccountId.replace(/^-100/, '').replace(/^-/, '');
    const chatRes = await fetch(
      `https://api.telegram.org/bot${token}/getChat?chat_id=${chat}`,
    );
    if (chatRes.ok) {
      const c = await chatRes.json() as any;
      base.followers = c.result?.members_count ?? 0;
      base.accountName = c.result?.title || c.result?.username || base.accountName;
      if (c.result?.photo?.big_file_id) {
        const fileRes = await fetch(
          `https://api.telegram.org/bot${token}/getFile?file_id=${c.result.photo.big_file_id}`,
        );
        if (fileRes.ok) {
          const f = await fileRes.json() as any;
          if (f.result?.file_path) base.avatarUrl = `https://api.telegram.org/file/bot${token}/${f.result.file_path}`;
        }
      }
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Tumblr ─────────────────────────────────────────────────────────────

async function fetchTumblr(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'tumblr', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const blogIdentifier = `${username}.tumblr.com`;
    const blogRes = await fetch(
      `https://api.tumblr.com/v2/blog/${blogIdentifier}/info`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (blogRes.ok) {
      const b = await blogRes.json() as any;
      const blog = b.response?.blog;
      if (blog) {
        base.followers = blog.followers ?? 0;
        base.postsCount = blog.posts ?? 0;
        base.accountName = blog.title || blog.name || base.accountName;
        if (blog.avatar) base.avatarUrl = blog.avatar;
      }
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── WordPress ──────────────────────────────────────────────────────────

async function fetchWordPress(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'wordpress', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const siteRes = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${_platformAccountId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (siteRes.ok) {
      const s = await siteRes.json() as any;
      base.followers = s.subscribers_count ?? 0;
      base.postsCount = s.post_count ?? 0;
      base.accountName = s.name || s.display_name || base.accountName;
      if (s.icon?.img) base.avatarUrl = s.icon.img;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Discord ────────────────────────────────────────────────────────────

async function fetchDiscord(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'discord', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${_platformAccountId}?with_counts=true`, {
      headers: { Authorization: `Bot ${token}` },
    }).catch(() => null);
    if (guildRes && guildRes.ok) {
      const g = await guildRes.json() as any;
      base.followers = g.approximate_member_count ?? 0;
      base.accountName = g.name || base.accountName;
      if (g.icon) base.avatarUrl = `https://cdn.discordapp.com/icons/${_platformAccountId}/${g.icon}.png`;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Slack ──────────────────────────────────────────────────────────────

async function fetchSlack(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'slack', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const teamRes = await fetch('https://slack.com/api/team.info', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (teamRes.ok) {
      const t = await teamRes.json() as any;
      if (t.ok) {
        base.followers = t.team?.members_count ?? 0;
        base.accountName = t.team?.name || base.accountName;
        if (t.team?.icon?.image_132) base.avatarUrl = t.team.icon.image_132;
      }
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── GMB (Google Business Profile) ──────────────────────────────────────

async function fetchGMB(
  token: string, _platformAccountId: string,
  username: string, displayName?: string, avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const base: PlatformAnalytics = {
    platform: 'gmb', accountId: _platformAccountId,
    accountName: displayName || username, avatarUrl,
    followers: 0, following: 0, postsCount: 0,
    engagement: 0, impressions: 0, reach: 0, profileViews: 0,
  };
  try {
    const locationRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${_platformAccountId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (locationRes.ok) {
      const l = await locationRes.json() as any;
      base.accountName = l.locationName || l.locationKey?.locationName || base.accountName;
    }
  } catch (e: any) { base.error = e.message; }
  return base;
}

// ─── Registry ──────────────────────────────────────────────────────────

type AnalyticsFetcher = (
  token: string,
  platformAccountId: string,
  username: string,
  displayName?: string,
  avatarUrl?: string,
) => Promise<PlatformAnalytics>;

const fetchers: Record<string, AnalyticsFetcher> = {
  instagram: fetchInstagram,
  facebook: fetchFacebook,
  x: fetchX,
  twitter: fetchX,
  linkedin: fetchLinkedIn,
  youtube: fetchYouTube,
  threads: fetchThreads,
  pinterest: fetchPinterest,
  bluesky: fetchBluesky,
  mastodon: fetchMastodon,
  reddit: fetchReddit,
  telegram: fetchTelegram,
  tumblr: fetchTumblr,
  wordpress: fetchWordPress,
  discord: fetchDiscord,
  slack: fetchSlack,
  gmb: fetchGMB,
};

export function getAnalyticsFetcher(platform: string): AnalyticsFetcher | null {
  return fetchers[platform.toLowerCase()] || null;
}

export async function fetchAnalyticsForAccount(
  platform: string,
  token: string,
  platformAccountId: string,
  username: string,
  displayName?: string,
  avatarUrl?: string,
): Promise<PlatformAnalytics> {
  const fetcher = getAnalyticsFetcher(platform);
  if (!fetcher) {
    return {
      platform, accountId: platformAccountId,
      accountName: displayName || username, avatarUrl,
      followers: 0, following: 0, postsCount: 0,
      engagement: 0, impressions: 0, reach: 0, profileViews: 0,
      error: `Analytics not available for ${platform}`,
    };
  }
  try {
    return await fetcher(token, platformAccountId, username, displayName, avatarUrl);
  } catch (e: any) {
    return {
      platform, accountId: platformAccountId,
      accountName: displayName || username, avatarUrl,
      followers: 0, following: 0, postsCount: 0,
      engagement: 0, impressions: 0, reach: 0, profileViews: 0,
      error: e.message,
    };
  }
}
