import fetch from 'node-fetch';
import { PrismaClient, PlatformType } from '@prisma/client';
import { decryptToken } from '../crypto';
import { checkRateLimit } from './common';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

interface RawComment {
  externalId: string
  externalPostId: string
  fromName: string
  fromUsername: string
  fromAvatar: string | null
  content: string
  timestamp: string
}

export async function syncCommentsForAccount(
  workspaceId: string,
  socialAccountId: string,
): Promise<number> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });
  if (!account || !account.accessToken) return 0;

  let token: string;
  try {
    token = decryptToken(account.accessToken, ENCRYPTION_KEY);
  } catch {
    token = account.accessToken;
  }

  const platform = account.platform.toLowerCase();
  const platformAccountId = account.platformAccountId || '';
  let rawComments: RawComment[] = [];
  let synced = 0;

  try {
    switch (platform) {
      case 'instagram':
        rawComments = await fetchInstagramComments(token, platformAccountId);
        break;
      case 'x':
      case 'twitter':
        rawComments = await fetchTwitterComments(token, platformAccountId);
        break;
      case 'facebook':
        rawComments = await fetchFacebookComments(token, platformAccountId);
        break;
      case 'youtube':
        rawComments = await fetchYouTubeComments(token, platformAccountId);
        break;
      case 'linkedin':
        rawComments = await fetchLinkedInComments(token, platformAccountId);
        break;
      case 'bluesky':
        rawComments = await fetchBlueskyComments(token as any, platformAccountId);
        break;
      default:
        return 0;
    }
  } catch (err: any) {
    console.error(`[comments] Error fetching for ${platform} (${socialAccountId}):`, err.message);
    return 0;
  }

  for (const rc of rawComments) {
    const existing = await prisma.comment.findUnique({
      where: { platform_externalId: { platform: account.platform, externalId: rc.externalId } },
    });
    if (existing) continue;

    await prisma.comment.create({
      data: {
        workspaceId,
        socialAccountId,
        platform: account.platform,
        externalId: rc.externalId,
        externalPostId: rc.externalPostId,
        fromName: rc.fromName,
        fromUsername: rc.fromUsername,
        fromAvatar: rc.fromAvatar,
        content: rc.content,
        timestamp: new Date(rc.timestamp),
      },
    });
    synced++;
  }

  return synced;
}

export async function replyToPlatformComment(
  platform: PlatformType,
  token: string,
  externalPostId: string,
  externalCommentId: string,
  content: string,
): Promise<boolean> {
  const p = platform.toLowerCase();

  switch (p) {
    case 'instagram': {
      const res = await fetch(`https://graph.facebook.com/v22.0/${externalPostId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok) throw new Error(`Instagram reply failed: ${await res.text()}`);
      return true;
    }
    case 'x':
    case 'twitter': {
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, reply: { in_reply_to_tweet_id: externalCommentId } }),
      });
      if (!res.ok) throw new Error(`X reply failed: ${await res.text()}`);
      return true;
    }
    case 'facebook': {
      const res = await fetch(`https://graph.facebook.com/v22.0/${externalCommentId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      if (!res.ok) throw new Error(`Facebook reply failed: ${await res.text()}`);
      return true;
    }
    case 'youtube': {
      const res = await fetch('https://www.googleapis.com/youtube/v3/commentThreads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            videoId: externalPostId,
            topLevelComment: { snippet: { textOriginal: content } },
          },
        }),
      });
      if (!res.ok) throw new Error(`YouTube reply failed: ${await res.text()}`);
      return true;
    }
    case 'linkedin': {
      const res = await fetch(`https://api.linkedin.com/rest/posts/${externalPostId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          actor: `urn:li:person:${externalPostId.split(':').pop()}`,
          object: `urn:li:post:${externalPostId}`,
          message: { text: content },
        }),
      });
      if (!res.ok) throw new Error(`LinkedIn reply failed: ${await res.text()}`);
      return true;
    }
    case 'bluesky': {
      const parts = externalCommentId.split('/');
      const repo = parts[0];
      const rkey = parts[1];
      const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          collection: 'app.bsky.feed.post',
          record: {
            text: content,
            reply: { parent: { uri: externalCommentId, cid: '' }, root: { uri: externalCommentId, cid: '' } },
            createdAt: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) throw new Error(`Bluesky reply failed: ${await res.text()}`);
      return true;
    }
    default:
      throw new Error(`Reply not supported for platform: ${platform}`);
  }
}

async function fetchInstagramComments(token: string, igUserId: string): Promise<RawComment[]> {
  await checkRateLimit('instagram');
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${igUserId}/media?fields=id,comments{text,username,id,timestamp,from{username,full_name,profile_picture_url}}&limit=25`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Instagram media fetch failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json() as any;
  const results: RawComment[] = [];
  for (const media of data.data || []) {
    const postId = media.id;
    for (const c of media.comments?.data || []) {
      results.push({
        externalId: c.id,
        externalPostId: postId,
        fromName: c.from?.full_name || c.from?.username || 'Instagram User',
        fromUsername: c.from?.username || 'unknown',
        fromAvatar: c.from?.profile_picture_url || null,
        content: c.text || '',
        timestamp: c.timestamp || new Date().toISOString(),
      });
    }
  }
  return results;
}

async function fetchTwitterComments(token: string, userId: string): Promise<RawComment[]> {
  await checkRateLimit('twitter');
  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=id,conversation_id`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!tweetsRes.ok) {
    const body = await tweetsRes.text().catch(() => '');
    throw new Error(`Twitter tweets fetch failed (${tweetsRes.status}): ${body.slice(0, 200)}`);
  }
  const tweetsData = await tweetsRes.json() as any;
  const results: RawComment[] = [];

  for (const tweet of tweetsData.data || []) {
    const convId = tweet.conversation_id || tweet.id;
    await checkRateLimit('twitter');
    const convRes = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${convId}&tweet.fields=id,author_id,created_at,text&expansions=author_id&user.fields=name,username,profile_image_url&max_results=25`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!convRes.ok) continue;
    const convData = await convRes.json() as any;
    const usersMap = new Map<string, any>();
    for (const u of convData.includes?.users || []) {
      usersMap.set(u.id, u);
    }
    for (const t of convData.data || []) {
      if (t.id === convId) continue;
      const author = usersMap.get(t.author_id) || {};
      results.push({
        externalId: t.id,
        externalPostId: convId,
        fromName: author.name || 'X User',
        fromUsername: author.username || 'unknown',
        fromAvatar: author.profile_image_url || null,
        content: t.text || '',
        timestamp: t.created_at || new Date().toISOString(),
      });
    }
  }
  return results;
}

async function fetchFacebookComments(token: string, pageId: string): Promise<RawComment[]> {
  await checkRateLimit('facebook');
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${pageId}/feed?fields=id,comments{id,message,from{name,id,picture},created_time}&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Facebook feed fetch failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json() as any;
  const results: RawComment[] = [];
  for (const post of data.data || []) {
    const postId = post.id;
    for (const c of post.comments?.data || []) {
      results.push({
        externalId: c.id,
        externalPostId: postId,
        fromName: c.from?.name || 'Facebook User',
        fromUsername: c.from?.id || 'unknown',
        fromAvatar: c.from?.picture?.data?.url || null,
        content: c.message || '',
        timestamp: c.created_time || new Date().toISOString(),
      });
    }
  }
  return results;
}

async function fetchYouTubeComments(token: string, channelId: string): Promise<RawComment[]> {
  await checkRateLimit('youtube');
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=5&order=date`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!searchRes.ok) {
    const body = await searchRes.text().catch(() => '');
    throw new Error(`YouTube search failed (${searchRes.status}): ${body.slice(0, 200)}`);
  }
  const searchData = await searchRes.json() as any;
  const results: RawComment[] = [];

  for (const item of searchData.items || []) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    await checkRateLimit('youtube');
    const commentRes = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!commentRes.ok) continue;
    const commentData = await commentRes.json() as any;
    for (const thread of commentData.items || []) {
      const top = thread.snippet?.topLevelComment?.snippet;
      if (!top) continue;
      results.push({
        externalId: thread.id,
        externalPostId: videoId,
        fromName: top.authorDisplayName || 'YouTube User',
        fromUsername: top.authorChannelId?.value || top.authorDisplayName || 'unknown',
        fromAvatar: top.authorProfileImageUrl || null,
        content: top.textDisplay || top.textOriginal || '',
        timestamp: top.publishedAt || new Date().toISOString(),
      });
    }
  }
  return results;
}

async function fetchLinkedInComments(token: string, _userId: string): Promise<RawComment[]> {
  await checkRateLimit('linkedin');
  const postRes = await fetch(
    `https://api.linkedin.com/rest/posts?q=author&author=urn:li:person:${_userId}&count=5`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
      },
    },
  );
  if (!postRes.ok) {
    const body = await postRes.text().catch(() => '');
    throw new Error(`LinkedIn posts fetch failed (${postRes.status}): ${body.slice(0, 200)}`);
  }
  const postData = await postRes.json() as any;
  const results: RawComment[] = [];

  for (const post of postData.elements || []) {
    const postUrn = post.id || '';
    if (!postUrn) continue;
    await checkRateLimit('linkedin');
    const commentRes = await fetch(
      `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}/comments?count=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
    );
    if (!commentRes.ok) continue;
    const commentData = await commentRes.json() as any;
    for (const c of commentData.elements || []) {
      const actor = c.actor || '';
      const message = c.message?.text || '';
      const created = c.created?.time ? new Date(c.created.time).toISOString() : new Date().toISOString();
      results.push({
        externalId: c.id || `${postUrn}_${actor}`,
        externalPostId: postUrn,
        fromName: actor.split(':').pop() || 'LinkedIn User',
        fromUsername: actor || 'unknown',
        fromAvatar: null,
        content: message,
        timestamp: created,
      });
    }
  }
  return results;
}

async function fetchBlueskyComments(token: string, _did: string): Promise<RawComment[]> {
  await checkRateLimit('bluesky');
  const feedRes = await fetch(
    `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${_did}&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!feedRes.ok) {
    const body = await feedRes.text().catch(() => '');
    throw new Error(`Bluesky feed fetch failed (${feedRes.status}): ${body.slice(0, 200)}`);
  }
  const feedData = await feedRes.json() as any;
  const results: RawComment[] = [];

  for (const feedItem of feedData.feed || []) {
    const post = feedItem.post;
    if (!post) continue;
    const postUri = post.uri;
    const replyCount = post.replyCount || 0;
    if (replyCount === 0) continue;

    await checkRateLimit('bluesky');
    const threadRes = await fetch(
      `https://bsky.social/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(postUri)}&depth=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!threadRes.ok) continue;
    const threadData = await threadRes.json() as any;
    const replies = threadData.thread?.replies || [];
    for (const reply of replies) {
      const rp = reply.post;
      if (!rp) continue;
      const author = rp.author || {};
      results.push({
        externalId: rp.uri || `${postUri}_${rp.cid}`,
        externalPostId: postUri,
        fromName: author.displayName || author.handle || 'Bluesky User',
        fromUsername: author.handle || 'unknown',
        fromAvatar: author.avatar || null,
        content: rp.record?.text || '',
        timestamp: rp.record?.createdAt || rp.indexedAt || new Date().toISOString(),
      });
    }
  }
  return results;
}
