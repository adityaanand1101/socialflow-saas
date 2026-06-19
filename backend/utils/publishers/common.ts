import fetch from 'node-fetch';

export interface PublishResult {
  url?: string;
  id?: string;
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
