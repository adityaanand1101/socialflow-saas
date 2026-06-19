import fetch from 'node-fetch';
import type { PublishResult } from './common';

const API_BASE = 'https://api.tumblr.com/v2';

export async function publishToTumblr(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'text';

  // platformAccountId is the blog identifier (e.g., myblog.tumblr.com)
  const blog = platformAccountId.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const text = sc.body || content || '';
  const title = sc.title || '';

  const payload: Record<string, any> = {
    type: ct,
    state: 'published',
  };

  switch (ct) {
    case 'photo': {
      payload.type = 'photo';
      if (mediaUrls.length > 0) {
        payload.data = mediaUrls.slice(0, 10);
      } else {
        throw new Error('Tumblr photo post requires at least one image');
      }
      if (text) payload.caption = text;
      break;
    }

    case 'link': {
      payload.type = 'link';
      payload.url = sc.url || mediaUrls[0] || '';
      if (!payload.url) throw new Error('Tumblr link post requires a URL');
      if (title) payload.title = title;
      if (text) payload.description = text;
      if (mediaUrls.length > 0) payload.thumbnail = mediaUrls[0];
      break;
    }

    case 'quote': {
      payload.type = 'quote';
      payload.text = text;
      payload.source = sc.source || '';
      break;
    }

    case 'video': {
      payload.type = 'video';
      if (mediaUrls.length > 0) {
        // Try embed URL first
        payload.embed = mediaUrls[0];
      } else {
        throw new Error('Tumblr video post requires a video URL');
      }
      if (text) payload.caption = text;
      break;
    }

    case 'chat': {
      payload.type = 'chat';
      payload.conversation = text;
      if (title) payload.title = title;
      break;
    }

    case 'audio': {
      payload.type = 'audio';
      if (mediaUrls.length > 0) {
        payload.external_url = mediaUrls[0];
      } else {
        throw new Error('Tumblr audio post requires an audio URL');
      }
      if (text) payload.caption = text;
      break;
    }

    case 'text':
    default: {
      payload.type = 'text';
      if (title) payload.title = title;
      payload.body = text || ' ';
      break;
    }
  }

  const res = await fetch(`${API_BASE}/blog/${blog}/post`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tumblr post failed: ${err.slice(0, 300)}`);
  }
  const result = await res.json() as any;
  const postId = result?.response?.blog?.id || result?.response?.id || result?.meta?.msg;
  return { id: String(postId), url: postId ? `https://${blog}/post/${postId}` : undefined };
}
