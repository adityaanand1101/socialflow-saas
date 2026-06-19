import fetch from 'node-fetch';
import FormData from 'form-data';
import type { PublishResult } from './common';

const API_BASE = 'https://oauth.reddit.com';

const UA = 'SocialFlow/1.0 (by /u/socialflow)';

export async function publishToReddit(
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

  const subreddit = sc.subreddit || '';
  if (!subreddit) throw new Error('Reddit requires a subreddit');

  const title = sc.title || content?.split('\n')[0] || '';
  if (!title) throw new Error('Reddit requires a post title');

  const params = new URLSearchParams();
  params.append('sr', subreddit.replace(/^r\//, ''));
  params.append('title', title.slice(0, 300));
  params.append('sendreplies', 'true');
  params.append('resubmit', 'true');

  if (sc.flair_id) params.append('flair_id', sc.flair_id);

  switch (ct) {
    case 'link': {
      const url = sc.url || '';
      if (!url) throw new Error('Reddit link post requires a URL');
      params.append('kind', 'link');
      params.append('url', url);
      if (sc.body) params.append('text', sc.body);
      break;
    }

    case 'image': {
      if (mediaUrls.length === 0) throw new Error('Reddit image post requires at least one image');

      // Step 1: Upload image to subreddit
      const imgRes = await fetch(mediaUrls[0]);
      if (!imgRes.ok) throw new Error(`Failed to fetch image for Reddit: ${imgRes.statusText}`);
      const imgBuffer = await imgRes.buffer();
      const filename = mediaUrls[0].split('/').pop() || 'image.jpg';

      const form = new FormData();
      form.append('file', imgBuffer, { filename, contentType: imgRes.headers.get('content-type') || 'image/jpeg' });
      form.append('sr', subreddit.replace(/^r\//, ''));
      form.append('name', 'image');

      const uploadRes = await fetch(`${API_BASE}/api/upload_sr_img`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': UA,
          ...form.getHeaders(),
        },
        body: form,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Reddit image upload failed: ${err.slice(0, 300)}`);
      }
      const uploadData = await uploadRes.json() as any;
      const imgSrc = uploadData?.img_src || uploadData?.url || '';
      if (!imgSrc) throw new Error('Reddit image upload returned no URL');

      // Step 2: Submit post with uploaded image URL
      params.append('kind', 'image');
      params.append('url', imgSrc);
      break;
    }

    case 'text':
    default: {
      params.append('kind', 'self');
      params.append('text', sc.body || content || '');
      break;
    }
  }

  const res = await fetch(`${API_BASE}/api/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
    },
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Reddit post failed: ${err.slice(0, 300)}`);
  }

  const result = await res.json() as any;
  const postName = result?.json?.data?.name; // t3_xxxxx
  const postId = postName?.startsWith('t3_') ? postName.slice(3) : postName;

  return {
    id: postId,
    url: postId ? `https://reddit.com/r/${subreddit}/comments/${postId}` : undefined,
  };
}
