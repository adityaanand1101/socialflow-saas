import fetch from 'node-fetch';
import type { PublishResult } from './common';

export async function publishToDiscord(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'message';

  // platformAccountId is the webhook URL
  let webhookUrl = platformAccountId;
  if (sc.thread_name) {
    webhookUrl += (webhookUrl.includes('?') ? '&' : '?') + `thread_name=${encodeURIComponent(sc.thread_name)}`;
  }

  if (ct === 'embed') {
    const embed: Record<string, any> = {};
    if (sc.embed_title) embed.title = sc.embed_title.slice(0, 256);
    if (sc.embed_description) embed.description = sc.embed_description.slice(0, 4096);
    if (sc.embed_url) embed.url = sc.embed_url;
    if (sc.embed_color) {
      const color = parseInt(sc.embed_color.replace('#', ''), 16);
      if (!isNaN(color)) embed.color = color;
    }
    if (sc.embed_image) embed.image = { url: sc.embed_image };
    if (sc.embed_thumbnail) embed.thumbnail = { url: sc.embed_thumbnail };

    const payload: Record<string, any> = {
      content: sc.content || content || '',
      embeds: [embed],
    };
    if (sc.webhook_username) payload.username = sc.webhook_username;
    if (sc.webhook_avatar) payload.avatar_url = sc.webhook_avatar;

    // Attach files if any
    const files: any[] = [];
    for (const url of mediaUrls.slice(0, 10)) {
      try {
        const fileRes = await fetch(url);
        if (fileRes.ok) {
          const buffer = await fileRes.buffer();
          const filename = url.split('/').pop() || 'file';
          files.push({ filename, buffer });
        }
              } catch (e) { console.warn('Failed to fetch Discord media:', e) }
    }

    if (files.length > 0) {
      const formData = new (await import('form-data')).default();
      formData.append('payload_json', JSON.stringify(payload));
      for (let i = 0; i < files.length; i++) {
        formData.append(`files[${i}]`, files[i].buffer, { filename: files[i].filename });
      }
      const res = await fetch(webhookUrl, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Discord embed (with files) failed: ${err.slice(0, 200)}`);
      }
      return { id: 'discord-embed' };
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Discord embed failed: ${err.slice(0, 200)}`);
    }
    return { id: 'discord-embed' };
  }

  // Simple message
  const payload: Record<string, any> = {
    content: (sc.content || content || '').slice(0, 2000),
  };
  if (sc.webhook_username) payload.username = sc.webhook_username;
  if (sc.webhook_avatar) payload.avatar_url = sc.webhook_avatar;

  const files: any[] = [];
  for (const url of mediaUrls.slice(0, 10)) {
    try {
      const fileRes = await fetch(url);
      if (fileRes.ok) {
        const buffer = await fileRes.buffer();
        const filename = url.split('/').pop() || 'file';
        files.push({ filename, buffer });
      }
    } catch (e) { console.warn('Failed to fetch Discord media:', e) }
  }

  if (files.length > 0) {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));
    for (let i = 0; i < files.length; i++) {
      formData.append(`files[${i}]`, files[i].buffer, { filename: files[i].filename });
    }
    const res = await fetch(webhookUrl, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Discord message (with files) failed: ${err.slice(0, 200)}`);
    }
    return { id: 'discord-message' };
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Discord message failed: ${err.slice(0, 200)}`);
  }
  return { id: 'discord-message' };
}
