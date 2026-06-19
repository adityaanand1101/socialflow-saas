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
  // NOTE: YouTube does not provide a stable public API for community posts.
  // These must be created manually via YouTube Studio.
  if (ct === 'community_post' || ct === 'community_poll') {
    throw new Error(
      'YouTube Community Posts are not supported via the YouTube Data API. ' +
      'Please create community posts manually through YouTube Studio at studio.youtube.com'
    );
  }

  // ── Video upload (longform / shorts) ──
  if (mediaUrls.length === 0) throw new Error('YouTube video upload requires at least one media file');

  const videoUrl = mediaUrls[0];
  const title = sc.title || content?.split('\n')[0] || 'Untitled Video';
  const description = sc.description || content || '';

  // Step 1: Fetch the video binary
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
  const videoBuffer = await videoRes.buffer();

  // Step 2: Initiate resumable upload
  const tags = sc.tags ? sc.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const categoryId = sc.categoryId || '22';

  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags: tags.slice(0, 30),
      categoryId,
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
