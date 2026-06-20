import fetch from 'node-fetch';

export interface PublishResult {
  url?: string;
  id?: string;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Generic media processing poller with exponential backoff.
 * @param checkFn - returns status string and optional dynamic interval
 * @param options - maxIterations (default 30), defaultInterval (default 2000ms), label (for error messages)
 */
export async function pollMediaStatus(
  checkFn: () => Promise<{ status: string; checkAfterSecs?: number }>,
  options?: { maxIterations?: number; defaultInterval?: number; label?: string },
): Promise<void> {
  const maxIter = options?.maxIterations ?? 30;
  let interval = options?.defaultInterval ?? 2000;
  const label = options?.label || 'media';

  for (let i = 0; i < maxIter; i++) {
    await sleep(interval);
    try {
      const result = await checkFn();
      const s = result.status;
      if (s === 'FINISHED' || s === 'PUBLISHED' || s === 'succeeded') return;
      if (s === 'ERROR' || s === 'FAILED' || s === 'failed') {
        throw new Error(`${label} processing failed with status: ${s}`);
      }
      // Use dynamic interval if provided (e.g., Twitter's check_after_secs)
      if (result.checkAfterSecs) interval = result.checkAfterSecs * 1000;
    } catch (err) {
      if (i < maxIter - 1) {
        interval = Math.min(interval * 1.5, 15000);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`${label} processing timed out after ${(maxIter * (options?.defaultInterval ?? 2000)) / 1000}s`);
}

export async function uploadMediaToPlatform(
  uploadUrl: string,
  mediaUrl: string,
  token: string,
  headers: Record<string, string> = {}
): Promise<any> {
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) throw new Error(`Failed to fetch media from ${mediaUrl}: ${mediaRes.statusText}`);

  const buffer = await mediaRes.buffer();

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const body = await uploadRes.text().catch(() => '');
    throw new Error(`Media upload failed (${uploadRes.status}): ${body.slice(0, 200)}`);
  }

  return uploadRes.json();
}

export function getContentType(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4',
    mov: 'video/quicktime', avi: 'video/x-msvideo',
    webm: 'video/webm', mkv: 'video/x-matroska',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Executes a publisher function with automatic token refresh on 401.
 * If the publisher throws a 401 error, it will refresh the token and retry once.
 */
export async function publishWithTokenRefresh<T>(
  publisherFn: (token: string) => Promise<T>,
  refreshFn: () => Promise<string>,
  context: { platform: string; accountId: string }
): Promise<T> {
  let token = await refreshFn();
  try {
    return await publisherFn(token);
  } catch (err: any) {
    const message = err?.message || String(err);
    const is401 = err?.status === 401 || 
                  message.includes('401') || 
                  message.includes('Unauthorized') ||
                  message.includes('invalid_token') ||
                  message.includes('expired_token');
    
    if (is401) {
      console.log(`[${context.platform}] Token expired for account ${context.accountId}, refreshing and retrying...`);
      token = await refreshFn();
      try {
        return await publisherFn(token);
      } catch (retryErr) {
        console.error(`[${context.platform}] Retry after token refresh failed:`, retryErr);
        throw retryErr;
      }
    }
    throw err;
  }
}

/**
 * Simple in-memory per-platform rate limiter.
 * Tracks request count per platform in a rolling 60-second window.
 */
const rateCounters: Record<string, { timestamps: number[]; limit: number }> = {};

export function setRateLimit(platform: string, maxRequestsPerMinute: number) {
  rateCounters[platform] = { timestamps: [], limit: maxRequestsPerMinute };
}

export async function checkRateLimit(platform: string): Promise<void> {
  const entry = rateCounters[platform];
  if (!entry) return; // no limit configured

  const now = Date.now();
  const window = 60_000;
  entry.timestamps = entry.timestamps.filter(t => now - t < window);

  if (entry.timestamps.length >= entry.limit) {
    const oldest = entry.timestamps[0];
    const waitMs = window - (now - oldest) + 100;
    await sleep(waitMs);
  }

  entry.timestamps.push(Date.now());
}

// Set sensible defaults for major platforms
setRateLimit('instagram', 200);
setRateLimit('facebook', 200);
setRateLimit('threads', 200);
setRateLimit('twitter', 150);
setRateLimit('x', 150);
setRateLimit('linkedin', 100);
setRateLimit('youtube', 60);
setRateLimit('reddit', 60);
setRateLimit('pinterest', 100);
setRateLimit('tumblr', 60);
setRateLimit('discord', 30);
setRateLimit('telegram', 30);
setRateLimit('slack', 60);
setRateLimit('bluesky', 100);
setRateLimit('mastodon', 300);
setRateLimit('gmb', 60);
