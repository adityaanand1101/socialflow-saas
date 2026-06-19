import fetch from 'node-fetch';
import type { PublishResult } from './common';
import { pollMediaStatus, checkRateLimit } from './common';

const GRAPH_API = 'https://graph.threads.net/v1.0';

export async function publishToThreads(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const userId = platformAccountId;
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'text';
  const text = sc.text || content || '';

  if (ct === 'carousel') {
    if (mediaUrls.length < 2) throw new Error('Threads carousel requires at least 2 media items');

    const childrenIds: string[] = [];
    for (const url of mediaUrls.slice(0, 20)) {
      const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);
      const childRes = await fetch(`${GRAPH_API}/${userId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: isVideo ? 'VIDEO' : 'IMAGE',
          [isVideo ? 'video_url' : 'image_url']: url,
          is_carousel_item: true,
          access_token: token,
        }),
      });
      if (!childRes.ok) {
        const err = await childRes.text();
        throw new Error(`Threads carousel item failed: ${err.slice(0, 200)}`);
      }
      const { id } = await childRes.json() as any;
      childrenIds.push(id);
    }

    for (const cid of childrenIds) {
      await checkRateLimit('threads');
      await pollMediaStatus(() =>
        fetch(`${GRAPH_API}/${cid}?fields=status_code&access_token=${token}`).then(async r => {
          if (!r.ok) return { status: '' };
          const d = await r.json() as any;
          return { status: d?.status_code || '' };
        }),
        { label: 'Threads carousel item' },
      );
    }

    const carouselRes = await fetch(`${GRAPH_API}/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        text,
        access_token: token,
      }),
    });
    if (!carouselRes.ok) {
      const err = await carouselRes.text();
      throw new Error(`Threads carousel creation failed: ${err.slice(0, 200)}`);
    }
    const { id: creationId } = await carouselRes.json() as any;

    const pubRes = await fetch(`${GRAPH_API}/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: token }),
    });
    if (!pubRes.ok) {
      const err = await pubRes.text();
      throw new Error(`Threads carousel publish failed: ${err.slice(0, 200)}`);
    }
    const result = await pubRes.json() as any;
    return { id: result.id };
  }

  // Text / Image / Video — single container flow
  if (mediaUrls.length === 0) {
    const createRes = await fetch(`${GRAPH_API}/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'TEXT', text, access_token: token }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Threads text creation failed: ${err.slice(0, 200)}`);
    }
    const { id: creationId } = await createRes.json() as any;

    const pubRes = await fetch(`${GRAPH_API}/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: token }),
    });
    if (!pubRes.ok) {
      const err = await pubRes.text();
      throw new Error(`Threads text publish failed: ${err.slice(0, 200)}`);
    }
    const result = await pubRes.json() as any;
    return { id: result.id };
  }

  const url = mediaUrls[0];
  const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

  const createRes = await fetch(`${GRAPH_API}/${userId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: isVideo ? 'VIDEO' : 'IMAGE',
      [isVideo ? 'video_url' : 'image_url']: url,
      text,
      access_token: token,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Threads media creation failed: ${err.slice(0, 200)}`);
  }
  const { id: creationId } = await createRes.json() as any;

  if (isVideo) {
    await checkRateLimit('threads');
    await pollMediaStatus(() =>
      fetch(`${GRAPH_API}/${creationId}?fields=status_code&access_token=${token}`).then(async r => {
        if (!r.ok) return { status: '' };
        const d = await r.json() as any;
        return { status: d?.status_code || '' };
      }),
      { label: 'Threads video' },
    );
  }

  const pubRes = await fetch(`${GRAPH_API}/${userId}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  if (!pubRes.ok) {
    const err = await pubRes.text();
    throw new Error(`Threads publish failed: ${err.slice(0, 200)}`);
  }
  const result = await pubRes.json() as any;
  return { id: result.id };
}
