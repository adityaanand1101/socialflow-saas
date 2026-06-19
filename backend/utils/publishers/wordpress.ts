import fetch from 'node-fetch';
import type { PublishResult } from './common';

export async function publishToWordPress(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'post';

  // platformAccountId contains the site URL (e.g., https://example.com)
  const siteUrl = platformAccountId.replace(/\/+$/, '');
  const apiBase = `${siteUrl}/wp-json/wp/v2`;

  const title = sc.title || content?.split('\n')[0] || '';
  const body = sc.body || content || '';

  let featuredMediaId: number | null = null;

  // Upload first media as featured image
  if (mediaUrls.length > 0) {
    try {
      const mediaRes = await fetch(mediaUrls[0]);
      if (mediaRes.ok) {
        const mediaBuffer = await mediaRes.buffer();
        const filename = mediaUrls[0].split('/').pop() || 'upload.jpg';
        const contentType = mediaRes.headers.get('content-type') || 'image/jpeg';

        const uploadRes = await fetch(`${apiBase}/media`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
          body: mediaBuffer,
        });
        if (uploadRes.ok) {
          const mediaData = await uploadRes.json() as any;
          featuredMediaId = mediaData.id;
        }
      }
    } catch {}
  }

  const postBody: Record<string, any> = {
    title,
    content: body,
    status: 'publish',
  };

  if (featuredMediaId) postBody.featured_media = featuredMediaId;
  if (sc.excerpt) postBody.excerpt = sc.excerpt;
  if (sc.slug) postBody.slug = sc.slug;
  if (sc.categories) {
    postBody.categories = sc.categories.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  if (sc.tags) {
    postBody.tags = sc.tags.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }

  const res = await fetch(`${apiBase}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postBody),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WordPress post failed: ${err.slice(0, 300)}`);
  }
  const result = await res.json() as any;
  return { id: String(result.id), url: result.link };
}
