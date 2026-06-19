import fetch from 'node-fetch';
import FormData from 'form-data';
import type { PublishResult } from './common';

async function uploadMedia(instanceUrl: string, token: string, mediaUrl: string, description?: string): Promise<string | null> {
  try {
    const fileRes = await fetch(mediaUrl);
    if (!fileRes.ok) return null;
    const buffer = await fileRes.buffer();
    const filename = mediaUrl.split('/').pop() || 'media';
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

    const form = new FormData();
    form.append('file', buffer, { filename, contentType });
    if (description) form.append('description', description);

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
  const ct = postTypes?.[pid] || 'text';
  const altText = sc.alt_text || '';
  for (const url of mediaUrls.slice(0, 4)) {
    const id = await uploadMedia(instanceUrl, token, url, altText || undefined);
    if (id) mediaIds.push(id);
  }

  if (ct === 'poll') {
    const options = (sc.poll_options || '').split('\n').filter(Boolean).slice(0, 4);
    const expiresIn = Math.min(Math.max(parseInt(sc.poll_expires_in) || 86400, 300), 604800);
    if (options.length < 2) throw new Error('Mastodon poll requires at least 2 options');

    const payload: Record<string, any> = {
      status: text.slice(0, 500),
      visibility,
      poll: {
        options,
        expires_in: expiresIn,
      },
    };
    if (spoiler) payload.spoiler_text = spoiler;

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
      throw new Error(`Mastodon poll post failed: ${err.slice(0, 300)}`);
    }
    const result = await res.json() as any;
    return {
      id: result.id,
      url: result.url || result.uri,
    };
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
