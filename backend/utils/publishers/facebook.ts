import fetch from 'node-fetch';
import type { PublishResult } from './common';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

export async function publishToFacebook(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string
): Promise<PublishResult> {
  const pageId = platformAccountId;

  if (mediaUrls.length === 0) {
    // Simple text post
    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content || '' }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook text post failed: ${err.slice(0, 300)}`);
    }

    const result = await res.json() as any;
    return { id: result.id, url: `https://facebook.com/${result.id}` };
  }

  if (mediaUrls.length === 1) {
    // Single photo post
    const url = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

    if (isVideo) {
      const res = await fetch(`${GRAPH_API}/${pageId}/videos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: url,
          description: content || '',
        }),
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
        body: JSON.stringify({
          url,
          message: content || '',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Facebook photo post failed: ${err.slice(0, 300)}`);
      }

      const result = await res.json() as any;
      return { id: result.id, url: `https://facebook.com/photo.php?fbid=${result.id}` };
    }
  }

  // Multiple photos - create a published album-style post
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
    } catch (err: any) {
      console.warn(`Facebook multi-photo upload skipped: ${err.message}`);
    }
  }

  if (attachedMedia.length === 0) {
    throw new Error('Facebook: failed to attach any media');
  }

  const feedRes = await fetch(`${GRAPH_API}/${pageId}/feed`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content || '',
      attached_media: attachedMedia.map(id => ({ media_fbid: id })),
    }),
  });

  if (!feedRes.ok) {
    const err = await feedRes.text();
    throw new Error(`Facebook multi-photo feed post failed: ${err.slice(0, 300)}`);
  }

  const result = await feedRes.json() as any;
  return { id: result.id, url: `https://facebook.com/${result.id}` };
}
