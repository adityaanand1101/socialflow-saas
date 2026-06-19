import fetch from 'node-fetch';
import type { PublishResult } from './common';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function publishToYouTube(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'longform';

  // ── Community Post / Community Poll ──
  if (ct === 'community_post' || ct === 'community_poll') {
    const isPoll = ct === 'community_poll';
    const body: Record<string, any> = {
      snippet: {
        channelId: platformAccountId,
        text: sc.body || sc.poll_question || content || '',
        type: isPoll ? 'poll' : 'text',
      },
    };

    if (isPoll) {
      const options = (sc.poll_options || '').split('\n').filter(Boolean).slice(0, 4);
      body.snippet.pollOptions = options.map((o: string) => ({ text: o }));
    }

    if (mediaUrls.length > 0) {
      body.snippet.media = mediaUrls.slice(0, 10).map(url => ({ url, type: 'image' }));
    }

    // YouTube community posts use a dedicated endpoint
    const res = await fetch(`${API_BASE}/liveChat/messages?part=snippet`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube community post failed: ${err.slice(0, 300)}`);
    }
    const result = await res.json() as any;
    return { id: result.id };
  }

  // ── Video upload (longform / shorts) ──
  if (mediaUrls.length === 0) throw new Error('YouTube video upload requires at least one media file');

  const videoUrl = mediaUrls[0];
  const title = sc.title || content?.split('\n')[0] || 'Untitled Video';
  const description = sc.description || content || '';
  const isShort = ct === 'shorts';

  // Step 1: Fetch the video binary
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
  const videoBuffer = await videoRes.buffer();

  // Step 2: Initiate resumable upload
  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags: [],
      categoryId: '22', // default: Entertainment
    },
    status: {
      privacyStatus: 'private',
      selfDeclaredMadeForKids: false,
    },
  };

  const initRes = await fetch(`${API_BASE}/videos?part=snippet,status&uploadType=resumable`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Length': String(videoBuffer.length),
      'X-Upload-Content-Type': 'video/*',
    },
    body: JSON.stringify(metadata),
  });
  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`YouTube upload init failed: ${err.slice(0, 300)}`);
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube: no upload URL returned');

  // Step 3: Upload the video binary
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/*',
      'Content-Length': String(videoBuffer.length),
    },
    body: videoBuffer,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`YouTube video upload failed: ${err.slice(0, 300)}`);
  }

  const result = await uploadRes.json() as any;
  return {
    id: result.id,
    url: `https://youtu.be/${result.id}`,
  };
}
