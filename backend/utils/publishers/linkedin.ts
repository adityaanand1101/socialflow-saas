import fetch from 'node-fetch';
import type { PublishResult } from './common';

export async function publishToLinkedIn(
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string
): Promise<PublishResult> {
  const author = `urn:li:person:${platformAccountId}`;

  const mediaAttachments: any[] = [];

  for (const url of mediaUrls.slice(0, 9)) {
    try {
      // Register the media upload
      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: author,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            }],
          },
        }),
      });

      if (!registerRes.ok) continue;

      const registerData = await registerRes.json() as any;
      const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const assetId = registerData.value?.asset;

      if (!uploadUrl || !assetId) continue;

      // Download and upload the media
      const mediaRes = await fetch(url);
      if (!mediaRes.ok) continue;
      const mediaBuffer = await mediaRes.buffer();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: mediaBuffer,
      });

      mediaAttachments.push(assetId);
    } catch (err: any) {
      console.warn(`LinkedIn media upload skipped for ${url}: ${err.message}`);
    }
  }

  const body: Record<string, any> = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content || '',
        },
        shareMediaCategory: mediaAttachments.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  if (mediaAttachments.length > 0) {
    body.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAttachments.map(asset => ({
      status: 'READY',
      description: { text: content?.slice(0, 200) || '' },
      media: asset,
      title: { text: '' },
    }));
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn post failed: ${err.slice(0, 300)}`);
  }

  const result = await res.json() as any;
  return { id: result.id };
}
