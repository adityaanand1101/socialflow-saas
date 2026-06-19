import fetch from 'node-fetch';
import type { PublishResult } from './common';
import { uploadMediaToPlatform, getContentType } from './common';

const TWITTER_API = 'https://api.twitter.com/2';
const UPLOAD_API = 'https://upload.twitter.com/1.1/media/upload.json';

async function uploadMediaToTwitter(token: string, mediaUrl: string): Promise<string> {
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) throw new Error(`Failed to fetch media: ${mediaRes.statusText}`);
  const buffer = await mediaRes.buffer();

  // INIT
  const totalBytes = buffer.length;
  const mimeType = getContentType(mediaUrl);
  const mediaCategory = mimeType.startsWith('video/') ? 'tweet_video' : 'tweet_image';

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

  // APPEND in chunks
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

  // FINALIZE
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

  return media_id_string;
}

export async function publishToTwitter(
  token: string,
  content: string,
  mediaUrls: string[],
  _platformAccountId: string
): Promise<PublishResult> {
  const mediaIds: string[] = [];

  for (const url of mediaUrls) {
    try {
      const mediaId = await uploadMediaToTwitter(token, url);
      mediaIds.push(mediaId);
    } catch (err: any) {
      console.warn(`Twitter media upload failed for ${url}: ${err.message}`);
    }
  }

  if (content.length > 280) {
    content = content.slice(0, 277) + '...';
  }

  const body: Record<string, any> = { text: content };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  const res = await fetch(`${TWITTER_API}/tweets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter post failed: ${err.slice(0, 300)}`);
  }

  const result = await res.json() as any;
  return {
    id: result.data?.id,
    url: result.data?.id ? `https://x.com/i/status/${result.data.id}` : undefined,
  };
}
