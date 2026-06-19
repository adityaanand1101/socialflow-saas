import type { PublishResult } from './common';
import { publishToInstagram } from './instagram';
import { publishToTwitter } from './twitter';
import { publishToLinkedIn } from './linkedin';
import { publishToFacebook } from './facebook';
import { publishToThreads } from './threads';
import { publishToYouTube } from './youtube';
import { publishToReddit } from './reddit';
import { publishToPinterest } from './pinterest';
import { publishToWordPress } from './wordpress';
import { publishToDiscord } from './discord';
import { publishToTelegram } from './telegram';
import { publishToTumblr } from './tumblr';
import { publishToBluesky } from './bluesky';
import { publishToMastodon } from './mastodon';
import { publishToSlack } from './slack';
import { publishToGMB } from './gmb';

export type Publisher = (
  token: string,
  content: string,
  mediaUrls: string[],
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
) => Promise<PublishResult>;

// Explicitly typed publisher map — each platform maps to a dedicated publisher function.
const publishers: Record<string, Publisher> = {
  instagram: publishToInstagram,
  x: publishToTwitter,
  twitter: publishToTwitter,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
  threads: publishToThreads,
  youtube: publishToYouTube,
  reddit: publishToReddit,
  pinterest: publishToPinterest,
  wordpress: publishToWordPress,
  discord: publishToDiscord,
  telegram: publishToTelegram,
  tumblr: publishToTumblr,
  bluesky: publishToBluesky,
  mastodon: publishToMastodon,
  slack: publishToSlack,
  gmb: publishToGMB,
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
  platformAccountId: string,
  structuredContent?: Record<string, Record<string, string>>,
  postTypes?: Record<string, string>,
): Promise<PublishResult> {
  const publisher = getPublisher(platform);
  if (!publisher) {
    throw new Error(
      `Publishing to "${platform}" is not yet implemented. ` +
      `To publish to ${platform}, add a publisher module at backend/utils/publishers/${platform}.ts ` +
      `or configure an outgoing webhook in the Integrations settings.`
    );
  }

  return publisher(token, content, mediaUrls, platformAccountId, structuredContent, postTypes);
}
