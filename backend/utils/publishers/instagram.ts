import fetch from 'node-fetch';
import type { PublishResult } from './common';

const GRAPH_API = 'https://graph.facebook.com/v18.0';

export async function publishToInstagram(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string
): Promise<PublishResult> {
  if (mediaUrls.length === 0) {
    // Simple text-only post — Instagram doesn't really support this, but we try
    // via a basic media container with a solid color or skip
    throw new Error('Instagram requires at least one media attachment');
  }

  const igUserId = platformAccountId;

  if (mediaUrls.length === 1) {
    // Single image or video
    const url = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

    if (isVideo) {
      // Step 1: Create media container
      const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'VIDEO',
          video_url: url,
          caption: content || '',
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Instagram video container creation failed: ${err.slice(0, 300)}`);
      }
      const { id: creationId } = await createRes.json() as any;

      // Step 2: Wait for the video to process (Instagram needs this)
      await new Promise(r => setTimeout(r, 5000));

      // Step 3: Publish
      const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: creationId }),
      });
      if (!publishRes.ok) {
        const err = await publishRes.text();
        throw new Error(`Instagram video publish failed: ${err.slice(0, 300)}`);
      }
      const result = await publishRes.json() as any;
      return { id: result.id, url: `https://www.instagram.com/p/${result.id}/` };
    } else {
      // Single image
      const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: url,
          caption: content || '',
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Instagram image container creation failed: ${err.slice(0, 300)}`);
      }
      const { id: creationId } = await createRes.json() as any;

      const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: creationId }),
      });
      if (!publishRes.ok) {
        const err = await publishRes.text();
        throw new Error(`Instagram image publish failed: ${err.slice(0, 300)}`);
      }
      const result = await publishRes.json() as any;
      return { id: result.id, url: `https://www.instagram.com/p/${result.id}/` };
    }
  }

  // Carousel (multiple images/videos)
  const childrenIds: string[] = [];
  for (const url of mediaUrls) {
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);
    const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(isVideo
        ? { media_type: 'VIDEO', video_url: url }
        : { image_url: url }
      ),
    });
    if (!containerRes.ok) {
      const err = await containerRes.text();
      throw new Error(`Instagram carousel item creation failed: ${err.slice(0, 300)}`);
    }
    const { id } = await containerRes.json() as any;
    childrenIds.push(id);
  }

  if (childrenIds.length > 10) childrenIds.splice(10);

  const carouselRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childrenIds,
      caption: content || '',
    }),
  });
  if (!carouselRes.ok) {
    const err = await carouselRes.text();
    throw new Error(`Instagram carousel creation failed: ${err.slice(0, 300)}`);
  }
  const { id: creationId } = await carouselRes.json() as any;

  await new Promise(r => setTimeout(r, 5000));

  const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId }),
  });
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram carousel publish failed: ${err.slice(0, 300)}`);
  }
  const result = await publishRes.json() as any;
  return { id: result.id, url: `https://www.instagram.com/p/${result.id}/` };
}
