import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type DispatchPayload = Record<string, any>;

async function postJSON(url: string, body: any, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`Integration webhook returned ${res.status}: ${text.slice(0, 200)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function dispatchSlack(config: any, event: string, payload: DispatchPayload) {
  if (!config.webhookUrl) return;
  const text = event === 'post.published'
    ? `✅ *Post Published*\n> ${(payload.content || '').slice(0, 500)}`
    : `❌ *Post Failed*\n> ${payload.errorMessage || 'Unknown error'}`;
  await postJSON(config.webhookUrl, { text, username: 'SocialFlow' });
}

async function dispatchDiscord(config: any, event: string, payload: DispatchPayload) {
  if (!config.webhookUrl) return;
  const content = event === 'post.published'
    ? `✅ **Post Published**\n${(payload.content || '').slice(0, 500)}`
    : `❌ **Post Failed**\n${payload.errorMessage || 'Unknown error'}`;
  await postJSON(config.webhookUrl, { content });
}

async function dispatchZapier(config: any, event: string, payload: DispatchPayload) {
  if (!config.webhookUrl) return;
  await postJSON(config.webhookUrl, {
    event,
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

async function dispatchSegment(config: any, event: string, payload: DispatchPayload) {
  if (!config.writeKey) return;
  const auth = Buffer.from(`${config.writeKey}:`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    await fetch('https://api.segment.io/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        userId: payload.workspaceId || 'unknown',
        event: event === 'post.published' ? 'Post Published' : 'Post Failed',
        properties: payload,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function dispatchGoogleAnalytics(config: any, event: string, payload: DispatchPayload) {
  if (!config.trackingId || !config.apiSecret) return;
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${config.trackingId}&api_secret=${config.apiSecret}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        client_id: payload.workspaceId || payload.postId || 'unknown',
        events: [{
          name: event === 'post.published' ? 'post_published' : 'post_failed',
          params: {
            post_id: payload.postId,
            content: (payload.content || '').slice(0, 100),
          },
        }],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

const handlers: Record<string, (config: any, event: string, payload: DispatchPayload) => Promise<void>> = {
  'slack': dispatchSlack,
  'slack-webhook': dispatchSlack,
  'discord-webhook': dispatchDiscord,
  'zapier': dispatchZapier,
  'segment': dispatchSegment,
  'ga': dispatchGoogleAnalytics,
};

export async function dispatchIntegrations(workspaceId: string, event: string, payload: DispatchPayload) {
  try {
    const pluginConfigs = await prisma.pluginConfig.findMany({
      where: { workspaceId, enabled: true },
    });
    if (pluginConfigs.length === 0) return;

    const results = await Promise.allSettled(
      pluginConfigs.map(async (pc) => {
        const handler = handlers[pc.pluginId];
        if (handler) {
          await handler(pc.config as Record<string, any> || {}, event, payload);
        }
      })
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Integration dispatch error:', result.reason);
      }
    }
  } catch (err) {
    console.error('Integration dispatcher failed:', err);
  }
}
