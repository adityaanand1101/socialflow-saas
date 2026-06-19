import fetch from 'node-fetch';
import FormData from 'form-data';
import type { PublishResult } from './common';

const API_BASE = 'https://api.telegram.org';

async function sendFile(
  botToken: string,
  method: string,
  chatId: string,
  fileUrl: string,
  caption: string,
  parseMode = 'Markdown',
): Promise<any> {
  // Try sending as URL first
  const payload: Record<string, any> = {
    chat_id: chatId,
    caption: caption.slice(0, 1024),
    parse_mode: parseMode,
  };

  if (method === 'sendPhoto') payload.photo = fileUrl;
  else if (method === 'sendVideo') payload.video = fileUrl;
  else if (method === 'sendDocument') payload.document = fileUrl;
  else if (method === 'sendAnimation') payload.animation = fileUrl;
  else if (method === 'sendAudio') payload.audio = fileUrl;

  const res = await fetch(`${API_BASE}/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) return res.json();

  // Fallback: upload as multipart
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) throw new Error(`Failed to fetch file for Telegram: ${fileUrl}`);

  const buffer = await fileRes.buffer();
  const filename = fileUrl.split('/').pop() || 'file';
  const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('caption', caption.slice(0, 1024));
  form.append('parse_mode', parseMode);

  const fieldMap: Record<string, string> = {
    sendPhoto: 'photo',
    sendVideo: 'video',
    sendDocument: 'document',
    sendAnimation: 'animation',
    sendAudio: 'audio',
  };
  form.append(fieldMap[method] || 'document', buffer, { filename, contentType });

  const uploadRes = await fetch(`${API_BASE}/bot${botToken}/${method}`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Telegram ${method} upload failed: ${err.slice(0, 200)}`);
  }
  return uploadRes.json();
}

export async function publishToTelegram(
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

  // token is the bot token; platformAccountId is the chat/channel ID
  const botToken = token;
  const chatId = platformAccountId;
  const text = sc.text || content || '';
  const parseMode = 'Markdown';

  if (ct === 'media_group') {
    if (mediaUrls.length < 2) throw new Error('Telegram media group requires at least 2 media items');

    const media = await Promise.all(
      mediaUrls.slice(0, 10).map(async (url, i) => {
        const isVideo = /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
        const item: Record<string, any> = {
          type: isVideo ? 'video' : 'photo',
          media: url,
        };
        if (i === 0 && text) item.caption = text.slice(0, 1024);
        return item;
      }),
    );

    const res = await fetch(`${API_BASE}/bot${botToken}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, media }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Telegram media group failed: ${err.slice(0, 200)}`);
    }
    return { id: 'tg-media-group' };
  }

  if (mediaUrls.length === 1) {
    const url = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);
    const isAnimation = /\.(gif)(\?|$)/i.test(url);
    const isAudio = /\.(mp3|ogg|wav|flac|m4a)(\?|$)/i.test(url);

    let method = 'sendDocument';
    if (isVideo) method = 'sendVideo';
    else if (isAnimation) method = 'sendAnimation';
    else if (isAudio) method = 'sendAudio';
    else method = 'sendPhoto';

    const result = await sendFile(botToken, method, chatId, url, text, parseMode);
    const msg = result?.result;
    return { id: String(msg?.message_id || 'tg-sent') };
  }

  if (mediaUrls.length > 1) {
    // Send first as media with caption, rest as documents
    const firstUrl = mediaUrls[0];
    const isVideo = /\.(mp4|webm|mov|avi)(\?|$)/i.test(firstUrl);
    let firstMethod = isVideo ? 'sendVideo' : 'sendPhoto';
    await sendFile(botToken, firstMethod, chatId, firstUrl, text, parseMode);

    for (const url of mediaUrls.slice(1, 10)) {
      await sendFile(botToken, 'sendDocument', chatId, url, '');
    }
    return { id: 'tg-multi-sent' };
  }

  // Plain text message
  const res = await fetch(`${API_BASE}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      parse_mode: parseMode,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram message failed: ${err.slice(0, 200)}`);
  }
  const result = await res.json() as any;
  return { id: String(result?.result?.message_id || 'tg-sent') };
}
