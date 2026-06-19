import type { PublishResult } from './common';
import { publishToInstagram } from './instagram';
import { publishToTwitter } from './twitter';
import { publishToLinkedIn } from './linkedin';
import { publishToFacebook } from './facebook';

export type Publisher = (
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string
) => Promise<PublishResult>;

// Explicitly typed publisher map — each platform maps to a dedicated publisher function.
// Platforms without a dedicated entry will still get the standard error,
// guiding the developer to implement a webhook or add a custom module.
const publishers: Record<string, Publisher> = {
  instagram: publishToInstagram,
  x: publishToTwitter,
  twitter: publishToTwitter,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
};

export function getPublisher(platform: string): Publisher | null {
  const key = platform.toLowerCase();
  return publishers[key] || null;
}

export async function publishToPlatform(
  platform: string,
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string
): Promise<PublishResult> {
  const publisher = getPublisher(platform);
  if (!publisher) {
    throw new Error(
      `Publishing to "${platform}" is not yet implemented. ` +
      `To publish to ${platform}, add a publisher module at backend/utils/publishers/${platform}.ts ` +
      `or configure an outgoing webhook in the Integrations settings.`
    );
  }

  return publisher(token, content, mediaUrls, platformAccountId);
}
