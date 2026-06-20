import fetch from 'node-fetch';
import type { PublishResult } from './common';
import { pollMediaStatus, checkRateLimit } from './common';

const GRAPH_API = 'https://graph.facebook.com/v22.0';

export async function publishToInstagram(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const igUserId = platformAccountId;
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'feed';
  const caption = sc.caption || content || '';

  // ── Reel ──
  if (ct === 'reel') {
    if (mediaUrls.length === 0) throw new Error('Instagram Reel requires at least one video');
    const url = mediaUrls[0];

    const reelBody: Record<string, any> = {
      media_type: 'REELS',
      video_url: url,
      caption,
    };
    if (sc.audio_name) reelBody.audio_name = sc.audio_name;

    const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(reelBody),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Instagram Reel container creation failed: ${err.slice(0, 300)}`);
    }
    const { id: creationId } = await createRes.json() as any;

    await checkRateLimit('instagram');
    await pollMediaStatus(() =>
      fetch(`${GRAPH_API}/${igUserId}/media?fields=status_code,status&ids=${creationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async r => {
        if (!r.ok) return { status: '' };
        const d = await r.json() as any;
        return { status: d?.status_code || d?.status || '' };
      }),
      { label: 'Instagram Reel' },
    );

    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId }),
    });
    if (!publishRes.ok) {
      const err = await publishRes.text();
      throw new Error(`Instagram Reel publish failed: ${err.slice(0, 300)}`);
    }
    const result = await publishRes.json() as any;
    return { id: result.id, url: `https://www.instagram.com/reel/${result.id}/` };
  }

  // ── Story ──
  if (ct === 'story') {
    if (mediaUrls.length === 0) throw new Error('Instagram Story requires at least one media');
    const url = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

    const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'STORIES',
        [isVideo ? 'video_url' : 'image_url']: url,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Instagram Story container creation failed: ${err.slice(0, 300)}`);
    }
    const { id: creationId } = await createRes.json() as any;

    if (isVideo) {
      await checkRateLimit('instagram');
      await pollMediaStatus(() =>
        fetch(`${GRAPH_API}/${igUserId}/media?fields=status_code,status&ids=${creationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async r => {
          if (!r.ok) return { status: '' };
          const d = await r.json() as any;
          return { status: d?.status_code || d?.status || '' };
        }),
        { label: 'Instagram Story' },
      );
    }

    const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId }),
    });
    if (!publishRes.ok) {
      const err = await publishRes.text();
      throw new Error(`Instagram Story publish failed: ${err.slice(0, 300)}`);
    }
    const result = await publishRes.json() as any;
    return { id: result.id };
  }

  // ── Feed / Carousel ──
  if (mediaUrls.length === 0) {
    throw new Error('Instagram requires at least one media attachment');
  }

  if (mediaUrls.length === 1) {
    const url = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

    if (isVideo) {
      const feedVideoBody: Record<string, any> = { media_type: 'VIDEO', video_url: url, caption };
      if (sc.location_id) feedVideoBody.location_id = sc.location_id;
      const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(feedVideoBody),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Instagram video container failed: ${err.slice(0, 300)}`);
      }
      const { id: creationId } = await createRes.json() as any;

      await checkRateLimit('instagram');
      await pollMediaStatus(() =>
        fetch(`${GRAPH_API}/${igUserId}/media?fields=status_code,status&ids=${creationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async r => {
          if (!r.ok) return { status: '' };
          const d = await r.json() as any;
          return { status: d?.status_code || d?.status || '' };
        }),
        { label: 'Instagram video' },
      );

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
      const imageBody: Record<string, any> = { image_url: url, caption };
      if (sc.location_id) imageBody.location_id = sc.location_id;
      if (sc.user_tags) {
        const tags = sc.user_tags.split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) imageBody.user_tags = tags;
      }
      const createRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(imageBody),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Instagram image container failed: ${err.slice(0, 300)}`);
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

  // Carousel
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
      throw new Error(`Instagram carousel item failed: ${err.slice(0, 300)}`);
    }
    const { id } = await containerRes.json() as any;
    childrenIds.push(id);
  }

  if (childrenIds.length > 10) childrenIds.splice(10);

  // Wait for any video items to process
  for (const cid of childrenIds) {
    await checkRateLimit('instagram');
    await pollMediaStatus(() =>
      fetch(`${GRAPH_API}/${igUserId}/media?fields=status_code,status&ids=${cid}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async r => {
        if (!r.ok) return { status: '' };
        const d = await r.json() as any;
        return { status: d?.status_code || d?.status || '' };
      }),
      { label: `Instagram carousel item ${cid}` },
    );
  }

  const carouselBody: Record<string, any> = {
    media_type: 'CAROUSEL',
    children: childrenIds,
    caption,
  };
  if (sc.location_id) carouselBody.location_id = sc.location_id;

  const carouselRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(carouselBody),
  });
  if (!carouselRes.ok) {
    const err = await carouselRes.text();
    throw new Error(`Instagram carousel creation failed: ${err.slice(0, 300)}`);
  }
  const { id: creationId } = await carouselRes.json() as any;

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
