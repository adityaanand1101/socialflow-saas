import fetch from 'node-fetch';
import FormData from 'form-data';
import type { PublishResult } from './common';

const SLACK_API = 'https://slack.com/api';

async function uploadFile(token: string, channels: string, fileUrl: string) {
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) return null;
  const buffer = await fileRes.buffer();
  const filename = fileUrl.split('/').pop() || 'file';
  const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

  const form = new FormData();
  form.append('channels', channels);
  form.append('filename', filename);
  form.append('file', buffer, { filename, contentType });

  const res = await fetch(`${SLACK_API}/files.upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
    body: form,
  });
  if (!res.ok) return null;
  return res.json();
}

export async function publishToSlack(
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
  const text = sc.text || content || '';

  // platformAccountId is the Slack channel ID
  const channel = platformAccountId;

  // ── blocks_json content type ──
  if (ct === 'blocks_json') {
    let blocks: Record<string, any>[];
    try {
      blocks = JSON.parse(sc.blocks_json || '[]');
    } catch {
      blocks = [];
    }

    const payload: Record<string, any> = {
      channel,
      text: text.slice(0, 4000),
    };
    if (blocks.length > 0) payload.blocks = blocks;
    if (sc.thread_ts) payload.thread_ts = sc.thread_ts;

    const res = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Slack blocks message failed: ${err.slice(0, 200)}`);
    }
    const data = await res.json() as any;
    if (!data.ok) throw new Error(`Slack blocks error: ${data.error}`);
    return { id: data.ts };
  }

  // ── Simple message ──
  const msgRes = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      text: text.slice(0, 4000),
      mrkdwn: true,
      ...(sc.thread_ts ? { thread_ts: sc.thread_ts } : {}),
    }),
  });
  if (!msgRes.ok) {
    const err = await msgRes.text();
    throw new Error(`Slack message failed: ${err.slice(0, 200)}`);
  }
  const msgData = await msgRes.json() as any;
  if (!msgData.ok) throw new Error(`Slack error: ${msgData.error}`);

  // Upload media files if any
  for (const url of mediaUrls.slice(0, 5)) {
    await uploadFile(token, channel, url);
  }

  return { id: msgData.ts };
}
