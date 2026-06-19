import fetch from 'node-fetch';
import type { PublishResult } from './common';

const API_BASE = 'https://api.linkedin.com';
const API_VERSION = '202603';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': API_VERSION,
  };
}

export async function publishToLinkedIn(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const authorUrn = `urn:li:person:${platformAccountId}`;
  const pid = platformAccountId.toLowerCase();
  const sc = structuredContent?.[pid] || {};
  const ct = postTypes?.[pid] || 'text';

  async function registerImage(imageUrl: string): Promise<string | null> {
    try {
      const initRes = await fetch(`${API_BASE}/rest/images?action=initializeUpload`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
          initializeUploadRequest: { owner: authorUrn },
        }),
      });
      if (!initRes.ok) return null;
      const initData = await initRes.json() as any;
      const uploadUrl = initData.value?.uploadUrl;
      const imageUrn = initData.value?.image;
      if (!uploadUrl || !imageUrn) return null;

      const mediaRes = await fetch(imageUrl);
      if (!mediaRes.ok) return null;
      const buffer = await mediaRes.buffer();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer,
      });
      if (!uploadRes.ok) return null;

      return imageUrn;
    } catch { return null; }
  }

  async function registerVideo(videoUrl: string): Promise<string | null> {
    try {
      const initRes = await fetch(`${API_BASE}/rest/videos?action=initializeUpload`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: authorUrn,
            fileSizeBytes: 0,
            uploadCaptions: false,
            uploadThumbnail: false,
          },
        }),
      });
      if (!initRes.ok) return null;
      const initData = await initRes.json() as any;
      const uploadUrl = initData.value?.uploadUrl;
      const videoUrn = initData.value?.video;
      if (!uploadUrl || !videoUrn) return null;

      const mediaRes = await fetch(videoUrl);
      if (!mediaRes.ok) return null;
      const buffer = await mediaRes.buffer();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer,
      });

      return videoUrn;
    } catch { return null; }
  }

  switch (ct) {
    case 'article': {
      const body = {
        author: authorUrn,
        commentary: sc.description || content || '',
        visibility: 'PUBLIC',
        content: {
          article: {
            title: sc.title || '',
            description: sc.description || '',
          },
        },
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      };

      const res = await fetch(`${API_BASE}/rest/posts`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn article post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id };
    }

    case 'poll': {
      const options = (sc.poll_options || '').split('\n').filter(Boolean).slice(0, 4).map((t: string) => ({ text: t }));
      const durationDays = Math.min(Math.max(parseInt(sc.poll_duration_days) || 7, 1), 14);

      const body = {
        author: authorUrn,
        commentary: sc.commentary || content || '',
        visibility: 'PUBLIC',
        content: {
          poll: {
            options,
            durationInDays: durationDays,
            votingCriteria: 'SINGLE_VOTE',
          },
        },
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      };

      const res = await fetch(`${API_BASE}/rest/posts`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn poll post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id };
    }

    case 'multi_image': {
      const imageUrns: string[] = [];
      for (const url of mediaUrls.slice(0, 20)) {
        const urn = await registerImage(url);
        if (urn) imageUrns.push(urn);
      }
      if (imageUrns.length === 0) throw new Error('LinkedIn multi-image: no images uploaded');

      const body = {
        author: authorUrn,
        commentary: sc.commentary || content || '',
        visibility: 'PUBLIC',
        content: {
          multiImage: {
            images: imageUrns.map(urn => ({ urn })),
          },
        },
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      };

      const res = await fetch(`${API_BASE}/rest/posts`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn multi-image post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id };
    }

    case 'document': {
      const docUrl = sc.document_url || '';
      if (!docUrl) throw new Error('LinkedIn document post requires a document URL');

      async function registerDocument(documentUrl: string): Promise<string | null> {
        try {
          const initRes = await fetch(`${API_BASE}/rest/documents?action=initializeUpload`, {
            method: 'POST',
            headers: headers(token),
            body: JSON.stringify({
              initializeUploadRequest: {
                owner: authorUrn,
              },
            }),
          });
          if (!initRes.ok) return null;
          const initData = await initRes.json() as any;
          const uploadUrl = initData.value?.uploadUrl;
          const docUrn = initData.value?.document;
          if (!uploadUrl || !docUrn) return null;

          const fileRes = await fetch(documentUrl);
          if (!fileRes.ok) return null;
          const buffer = await fileRes.buffer();

          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: buffer,
          });

          return docUrn;
        } catch { return null; }
      }

      const docUrn = await registerDocument(docUrl);
      if (!docUrn) throw new Error('LinkedIn document upload failed');

      const body = {
        author: authorUrn,
        commentary: sc.commentary || content || '',
        visibility: 'PUBLIC',
        content: {
          document: {
            id: docUrn,
          },
        },
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      };

      const res = await fetch(`${API_BASE}/rest/posts`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn document post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id };
    }

    // text, image, video — use the basic Posts API flow
    default: {
      const mediaAttachments: { urn: string; type: 'IMAGE' | 'VIDEO' }[] = [];

      for (const url of mediaUrls.slice(0, 9)) {
        const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);
        const urn = isVideo ? await registerVideo(url) : await registerImage(url);
        if (urn) mediaAttachments.push({ urn, type: isVideo ? 'VIDEO' : 'IMAGE' });
      }

      const lifecycleState = 'PUBLISHED';
      const contentPayload: any = {};

      if (mediaAttachments.length > 0) {
        const main = mediaAttachments[0];
        if (mediaAttachments.length === 1 && main.type === 'IMAGE') {
          contentPayload.media = {
            id: main.urn,
            title: sc.title || '',
            description: sc.commentary || content || '',
          };
        } else if (mediaAttachments.length === 1 && main.type === 'VIDEO') {
          contentPayload.media = {
            id: main.urn,
            title: sc.title || '',
            description: sc.commentary || content || '',
          };
        } else {
          contentPayload.multiImage = {
            images: mediaAttachments.map(a => ({ urn: a.urn })),
          };
        }
      }

      const body = {
        author: authorUrn,
        commentary: sc.commentary || content || '',
        visibility: 'PUBLIC',
        content: Object.keys(contentPayload).length > 0 ? contentPayload : undefined,
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState,
        isReshareDisabledByAuthor: false,
      };

      const res = await fetch(`${API_BASE}/rest/posts`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn post failed: ${err.slice(0, 300)}`);
      }
      const result = await res.json() as any;
      return { id: result.id };
    }
  }
}
