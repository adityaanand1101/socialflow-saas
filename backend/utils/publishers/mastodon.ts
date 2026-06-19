import fetch from 'node-fetch';
import FormData from 'form-data';
import type { PublishResult } from './common';

async function uploadMedia(instanceUrl: string, token: string, mediaUrl: string): Promise<string | null> {
  try {
    const fileRes = await fetch(mediaUrl);
    if (!fileRes.ok) return null;
    const buffer = await fileRes.buffer();
    const filename = mediaUrl.split('/').pop() || 'media';
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

    const form = new FormData();
    form.append('file', buffer, { filename, contentType });

    const res = await fetch(`${instanceUrl}/api/v1/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.id;
  } catch {
    return null;
  }
}

export async function publishToMastodon(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const text = sc.text || content || '';
  const spoiler = sc.content_warning || '';
  const visibility = sc.visibility || 'public';

  // platformAccountId is the full instance URL (e.g., https://mastodon.social)
  const instanceUrl = platformAccountId.replace(/\/+$/, '');

  // Upload media
  const mediaIds: string[] = [];
  for (const url of mediaUrls.slice(0, 4)) {
    const id = await uploadMedia(instanceUrl, token, url);
    if (id) mediaIds.push(id);
  }

  const payload: Record<string, any> = {
    status: text.slice(0, 500),
    visibility,
  };
  if (spoiler) payload.spoiler_text = spoiler;
  if (mediaIds.length > 0) payload.media_ids = mediaIds;

  const res = await fetch(`${instanceUrl}/api/v1/statuses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mastodon post failed: ${err.slice(0, 300)}`);
  }
  const result = await res.json() as any;
  return {
    id: result.id,
    url: result.url || result.uri,
  };
}
