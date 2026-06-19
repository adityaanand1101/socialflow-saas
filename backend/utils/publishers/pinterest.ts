import fetch from 'node-fetch';
import type { PublishResult } from './common';

const API_BASE = 'https://api.pinterest.com/v5';

export async function publishToPinterest(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'standard_pin';

  const boardId = platformAccountId; // OAuth gives access to user's boards
  const title = sc.title || content?.split('\n')[0] || '';
  const description = sc.description || content || '';
  const link = sc.link || '';

  if (mediaUrls.length === 0) throw new Error('Pinterest requires at least one media file');

  // ── Video Pin — two-step: upload video, then create pin ──
  if (ct === 'video_pin') {
    const videoUrl = mediaUrls[0];
    const coverUrl = mediaUrls[1] || mediaUrls[0]; // use first as cover if no second

    // Step 1: Register video upload
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
    const videoBuffer = await videoRes.buffer();

    const registerRes = await fetch(`${API_BASE}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media_type: 'video' }),
    });
    if (!registerRes.ok) {
      const err = await registerRes.text();
      throw new Error(`Pinterest media register failed: ${err.slice(0, 200)}`);
    }
    const { media_id, upload_url, upload_parameters } = await registerRes.json() as any;

    // Step 2: Upload binary to the returned URL
    await fetch(upload_url, {
      method: 'POST',
      headers: { 'Content-Type': 'video/mp4' },
      body: videoBuffer,
    });

    // Step 3: Create pin with video_id and cover image
    const body: Record<string, any> = {
      title: title.slice(0, 100),
      description: description.slice(0, 800),
      board_id: boardId,
      media_source: {
        source_type: 'video_id',
        media_id,
        cover_image_url: coverUrl,
      },
    };
    if (link) body.link = link;

    const pinRes = await fetch(`${API_BASE}/pins`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!pinRes.ok) {
      const err = await pinRes.text();
      throw new Error(`Pinterest video pin creation failed: ${err.slice(0, 300)}`);
    }
    const pinResult = await pinRes.json() as any;
    return { id: pinResult.id, url: `https://pinterest.com/pin/${pinResult.id}` };
  }

  // ── Standard / Image Pin ──
  const body: Record<string, any> = {
    title: title.slice(0, 100),
    description: description.slice(0, 800),
    board_id: boardId,
    media_source: {
      source_type: 'image_url',
      url: mediaUrls[0],
      is_standard: true,
    },
  };
  if (link) body.link = link;
  if (title) body.alt_text = title.slice(0, 500);

  const res = await fetch(`${API_BASE}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest pin creation failed: ${err.slice(0, 300)}`);
  }
  const result = await res.json() as any;
  return { id: result.id, url: `https://pinterest.com/pin/${result.id}` };
}
