import fetch from 'node-fetch';
import type { PublishResult } from './common';
import { getContentType, pollMediaStatus, checkRateLimit } from './common';

const TWITTER_API = 'https://api.twitter.com/2';
const UPLOAD_API = 'https://upload.twitter.com/1.1/media/upload.json';

async function uploadMediaToTwitter(token: string, mediaUrl: string): Promise<string> {
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) throw new Error(`Failed to fetch media: ${mediaRes.statusText}`);
  const buffer = await mediaRes.buffer();

  const totalBytes = buffer.length;
  const mimeType = getContentType(mediaUrl);
  const mediaCategory = mimeType.startsWith('video/') ? 'tweet_video' : mimeType === 'image/gif' ? 'tweet_gif' : 'tweet_image';

  const initRes = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'INIT',
      media_type: mimeType,
      total_bytes: String(totalBytes),
      media_category: mediaCategory,
    }),
  });
  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Twitter media INIT failed: ${err.slice(0, 200)}`);
  }
  const { media_id_string } = await initRes.json() as any;

  const chunkSize = 5 * 1024 * 1024;
  for (let offset = 0; offset < totalBytes; offset += chunkSize) {
    const chunk = buffer.slice(offset, Math.min(offset + chunkSize, totalBytes));
    const formData = new URLSearchParams();
    formData.append('command', 'APPEND');
    formData.append('media_id', media_id_string);
    formData.append('segment_index', String(Math.floor(offset / chunkSize)));
    formData.append('media', chunk.toString('base64'));

    const appendRes = await fetch(UPLOAD_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    if (!appendRes.ok) {
      const err = await appendRes.text();
      throw new Error(`Twitter media APPEND failed: ${err.slice(0, 200)}`);
    }
  }

  const finalizeRes = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      command: 'FINALIZE',
      media_id: media_id_string,
    }),
  });
  if (!finalizeRes.ok) {
    const err = await finalizeRes.text();
    throw new Error(`Twitter media FINALIZE failed: ${err.slice(0, 200)}`);
  }
  const finalData = await finalizeRes.json() as any;

  // Poll for video/GIF processing completion
  if (mimeType.startsWith('video/') || mimeType === 'image/gif') {
    const processingInfo = finalData.processing_info;
    if (processingInfo && processingInfo.state) {
      await checkRateLimit('twitter');
      await pollMediaStatus(async () => {
        const statusRes = await fetch(`${UPLOAD_API}?command=STATUS&media_id=${media_id_string}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!statusRes.ok) return { status: 'pending', checkAfterSecs: 5 };
        const statusData = await statusRes.json() as any;
        const state = statusData.processing_info?.state || 'succeeded';
        const checkAfterSecs = statusData.processing_info?.check_after_secs;
        return { status: state === 'succeeded' ? 'FINISHED' : state === 'failed' ? 'FAILED' : state, checkAfterSecs };
      }, {
        maxIterations: 60,
        defaultInterval: 5000,
        label: 'Twitter media',
      });
    }
  }

  return media_id_string;
}

export async function publishToTwitter(
  token: string,
  content: string,
  mediaUrls: string[],
  _platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = _platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'post';

  // ── Poll ──
  if (ct === 'poll') {
    const text = (sc.text || content || '').slice(0, 280);
    const options = (sc.poll_options || '').split('\n').filter(Boolean).slice(0, 4);
    const durationMinutes = Math.min(Math.max(parseInt(sc.poll_duration_minutes) || 1440, 5), 10080);

    if (options.length < 2) throw new Error('X Poll requires at least 2 options');

    const body: Record<string, any> = {
      text,
      poll: {
        options: options.map((o: string) => ({ label: o.slice(0, 25) })),
        duration_minutes: durationMinutes,
      },
    };

    const res = await fetch(`${TWITTER_API}/tweets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`X Poll post failed: ${err.slice(0, 300)}`);
    }
    const result = await res.json() as any;
    return {
      id: result.data?.id,
      url: result.data?.id ? `https://x.com/i/status/${result.data.id}` : undefined,
    };
  }

  // ── Regular post with optional media ──
  const mediaIds: string[] = [];
  for (const url of mediaUrls) {
    try {
      const mediaId = await uploadMediaToTwitter(token, url);
      mediaIds.push(mediaId);
    } catch (err: any) {
      console.warn(`Twitter media upload failed for ${url}: ${err.message}`);
    }
  }

  let text = sc.text || content || '';
  if (text.length > 280) {
    text = text.slice(0, 277) + '...';
  }

  const body: Record<string, any> = { text };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  const res = await fetch(`${TWITTER_API}/tweets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X post failed: ${err.slice(0, 300)}`);
  }
  const result = await res.json() as any;
  return {
    id: result.data?.id,
    url: result.data?.id ? `https://x.com/i/status/${result.data.id}` : undefined,
  };
}
