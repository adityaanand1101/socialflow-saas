import fetch from 'node-fetch';
import type { PublishResult } from './common';

const BS_BASE = 'https://bsky.social/xrpc';

async function createSession(identifier: string, password: string) {
  const res = await fetch(`${BS_BASE}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bluesky auth failed: ${err.slice(0, 200)}`);
  }
  return res.json() as Promise<{ accessJwt: string; did: string; handle: string }>;
}

export async function publishToBluesky(
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
  const altText = sc.alt_text || '';

  // token is the app password, platformAccountId is the handle (e.g., handle.bsky.social)
  const session = await createSession(platformAccountId, token);
  const { accessJwt, did } = session;

  // Build embed if media exists
  let embed: Record<string, any> | undefined;
  if (mediaUrls.length > 0) {
    const images: Record<string, any>[] = [];
    for (const url of mediaUrls.slice(0, 4)) {
      const imgRes = await fetch(url);
      if (!imgRes.ok) continue;
      const buffer = await imgRes.buffer();
      const mime = imgRes.headers.get('content-type') || 'image/jpeg';

      // Upload blob
      const blobRes = await fetch(`${BS_BASE}/com.atproto.repo.uploadBlob`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessJwt}`,
          'Content-Type': mime,
        },
        body: buffer,
      });
      if (!blobRes.ok) continue;
      const blobData = await blobRes.json() as any;
      images.push({
        alt: altText || text.slice(0, 100),
        image: blobData.blob,
      });
    }
    if (images.length > 0) {
      embed = {
        $type: 'app.bsky.embed.images',
        images,
      };
    }
  }

  // Build the post record
  const record: Record<string, any> = {
    $type: 'app.bsky.feed.post',
    text: text.slice(0, 300),
    createdAt: new Date().toISOString(),
  };

  if (embed) record.embed = embed;

  const res = await fetch(`${BS_BASE}/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: did,
      collection: 'app.bsky.feed.post',
      record,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bluesky post failed: ${err.slice(0, 300)}`);
  }
  const result = await res.json() as any;
  const rkey = result.uri?.split('/').pop();
  return {
    id: result.cid,
    url: rkey ? `https://bsky.app/profile/${did}/post/${rkey}` : undefined,
  };
}
