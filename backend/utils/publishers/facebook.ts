import fetch from 'node-fetch';
import type { PublishResult } from './common';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

export async function publishToFacebook(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pageId = platformAccountId;
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'feed';

  // ── Link Share ──
  if (ct === 'link') {
    const linkUrl = sc.url || '';
    const message = sc.message || content || '';

    const body: Record<string, any> = { message, link: linkUrl };
    if (mediaUrls.length > 0) {
      const attachedMedia: string[] = [];
      for (const url of mediaUrls.slice(0, 10)) {
        try {
          const photoRes = await fetch(`${GRAPH_API}/${pageId}/photos`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, published: false }),
          });
          if (photoRes.ok) {
            const { id } = await photoRes.json() as any;
            attachedMedia.push(id);
          }
        } catch {}
      }
      if (attachedMedia.length > 0) {
        body.attached_media = attachedMedia.map(id => ({ media_fbid: id }));
      }
    }

    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook link post failed: ${err.slice(0, 300)}`);
    }
    const result = await res.json() as any;
    return { id: result.id, url: `https://facebook.com/${result.id}` };
  }

  // ── Reels ──
  if (ct === 'reels') {
    if (mediaUrls.length === 0) throw new Error('Facebook Reels requires at least one video');
    const videoUrl = mediaUrls[0];
    const description = sc.message || content || '';

    const res = await fetch(`${GRAPH_API}/${pageId}/video_reels`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: videoUrl,
        description,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook Reels post failed: ${err.slice(0, 300)}`);
    }
    const result = await res.json() as any;
    return { id: result.id };
  }

  // ── Feed Post (text, image, video, multi-photo) ──
  const message = sc.message || content || '';

  if (mediaUrls.length === 0) {
    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook text post failed: ${err.slice(0, 300)}`);
    }
    const result = await res.json() as any;
    return { id: result.id, url: `https://facebook.com/${result.id}` };
  }

  if (mediaUrls.length === 1) {
    const url = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

    if (isVideo) {
      const res = await fetch(`${GRAPH_API}/${pageId}/videos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: url, description: message }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Facebook video post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id };
    } else {
      const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, message }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Facebook photo post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id, url: `https://facebook.com/photo.php?fbid=${result.id}` };
    }
  }

  // Multi-photo
  const attachedMedia: string[] = [];
  for (const url of mediaUrls.slice(0, 10)) {
    try {
      const photoRes = await fetch(`${GRAPH_API}/${pageId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, published: false }),
      });
      if (photoRes.ok) {
        const { id } = await photoRes.json() as any;
        attachedMedia.push(id);
      }
    } catch {}
  }

  if (attachedMedia.length === 0) throw new Error('Facebook: failed to attach any media');

  const feedRes = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      attached_media: attachedMedia.map(id => ({ media_fbid: id })),
    }),
  });
  if (!feedRes.ok) {
    const err = await feedRes.text();
    throw new Error(`Facebook multi-photo post failed: ${err.slice(0, 300)}`);
  }
  const result = await feedRes.json() as any;
  return { id: result.id, url: `https://facebook.com/${result.id}` };
}
