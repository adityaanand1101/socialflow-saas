export type MediaType = 'image' | 'video' | 'none'

export interface PlatformConstraints {
  id: string
  label: string
  maxChars: number
  mediaType: MediaType | 'both'
  maxImages: number
  maxVideos: number
  imageRatios: string[]
  videoRatios: string[]
  maxVideoDurationSec: number
  allowCarousel: boolean
  notes: string[]
}

export const PLATFORM_CONSTRAINTS: Record<string, PlatformConstraints> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    maxChars: 2200,
    mediaType: 'both',
    maxImages: 10,
    maxVideos: 1,
    imageRatios: ['1:1', '4:5', '16:9'],
    videoRatios: ['1:1', '4:5', '16:9', '9:16'],
    maxVideoDurationSec: 90,
    allowCarousel: true,
    notes: ['Single video max 90s feed / 15min Reels', 'Carousel supports up to 10 slides', 'First media is the cover']
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    maxChars: 63206,
    mediaType: 'both',
    maxImages: 30,
    maxVideos: 1,
    imageRatios: ['1:1', '16:9', '4:3'],
    videoRatios: ['16:9', '1:1'],
    maxVideoDurationSec: 14400,
    allowCarousel: true,
    notes: ['Images cropped to 1:1 or 16:9 in feed', 'Videos up to 4 hours']
  },
  x: {
    id: 'x',
    label: 'X (Twitter)',
    maxChars: 280,
    mediaType: 'both',
    maxImages: 4,
    maxVideos: 1,
    imageRatios: ['16:9', '1:1', '4:3'],
    videoRatios: ['16:9', '1:1'],
    maxVideoDurationSec: 140,
    allowCarousel: false,
    notes: ['Images display 16:9 in timeline', 'Video max 2min 20s', 'No carousel — single image/video']
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    maxChars: 3000,
    mediaType: 'both',
    maxImages: 20,
    maxVideos: 1,
    imageRatios: ['1:1', '16:9', '4:3'],
    videoRatios: ['16:9', '1:1'],
    maxVideoDurationSec: 600,
    allowCarousel: true,
    notes: ['Document upload also supported', 'Video max 10min', 'Carousel up to 20 slides']
  },
  threads: {
    id: 'threads',
    label: 'Threads',
    maxChars: 500,
    mediaType: 'both',
    maxImages: 10,
    maxVideos: 1,
    imageRatios: ['1:1', '16:9', '4:5', '9:16'],
    videoRatios: ['16:9', '1:1', '9:16'],
    maxVideoDurationSec: 300,
    allowCarousel: true,
    notes: ['Video max 5min', 'Supports alt text on images']
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    maxChars: 5000,
    mediaType: 'video',
    maxImages: 0,
    maxVideos: 1,
    imageRatios: ['16:9'],
    videoRatios: ['16:9'],
    maxVideoDurationSec: 43200,
    allowCarousel: false,
    notes: ['Video required — thumbnail auto-generated', 'Max 12 hours', 'Description supports links & timestamps']
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    maxChars: 500,
    mediaType: 'image',
    maxImages: 1,
    maxVideos: 0,
    imageRatios: ['2:3', '1:1', '1:3.5'],
    videoRatios: [],
    maxVideoDurationSec: 0,
    allowCarousel: false,
    notes: ['2:3 ratio performs best', 'Single image or video', 'No carousel']
  },
  bluesky: {
    id: 'bluesky',
    label: 'Bluesky',
    maxChars: 300,
    mediaType: 'both',
    maxImages: 4,
    maxVideos: 1,
    imageRatios: ['1:1', '16:9', '3:2'],
    videoRatios: ['16:9'],
    maxVideoDurationSec: 60,
    allowCarousel: false,
    notes: ['Video max 60s', 'Max 4 images per post', 'No carousel']
  },
  mastodon: {
    id: 'mastodon',
    label: 'Mastodon',
    maxChars: 500,
    mediaType: 'both',
    maxImages: 4,
    maxVideos: 1,
    imageRatios: ['16:9', '1:1'],
    videoRatios: ['16:9'],
    maxVideoDurationSec: 600,
    allowCarousel: false,
    notes: ['Max 4 images or 1 video', 'CW (content warning) supported', 'No carousel']
  },
  reddit: {
    id: 'reddit',
    label: 'Reddit',
    maxChars: 10000,
    mediaType: 'both',
    maxImages: 1,
    maxVideos: 1,
    imageRatios: ['16:9', '1:1'],
    videoRatios: ['16:9'],
    maxVideoDurationSec: 900,
    allowCarousel: false,
    notes: ['Single image or video per post', 'Link posts also available', 'Subreddit rules vary']
  },
  wordpress: {
    id: 'wordpress',
    label: 'WordPress',
    maxChars: 100000,
    mediaType: 'both',
    maxImages: 999,
    maxVideos: 999,
    imageRatios: ['*'],
    videoRatios: ['*'],
    maxVideoDurationSec: 43200,
    allowCarousel: false,
    notes: ['Full article/blog support', 'Unlimited media via block editor', 'Featured image recommended']
  },
  discord: {
    id: 'discord',
    label: 'Discord',
    maxChars: 2000,
    mediaType: 'both',
    maxImages: 10,
    maxVideos: 1,
    imageRatios: ['*'],
    videoRatios: ['*'],
    maxVideoDurationSec: 600,
    allowCarousel: false,
    notes: ['Max 10 attachments total', 'Video max 10min (25MB limit)', 'Embeds from links']
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    maxChars: 4096,
    mediaType: 'both',
    maxImages: 10,
    maxVideos: 1,
    imageRatios: ['*'],
    videoRatios: ['*'],
    maxVideoDurationSec: 3600,
    allowCarousel: false,
    notes: ['Gallery (multiple images viewed as album)', 'Video max 1 hour', 'Supports file attachments']
  },
  tumblr: {
    id: 'tumblr',
    label: 'Tumblr',
    maxChars: 10000,
    mediaType: 'both',
    maxImages: 30,
    maxVideos: 1,
    imageRatios: ['*'],
    videoRatios: ['16:9', '4:3'],
    maxVideoDurationSec: 600,
    allowCarousel: false,
    notes: ['Text, photo, quote, link, chat, audio, video post types', 'Video max 10min']
  },
  slack: {
    id: 'slack',
    label: 'Slack',
    maxChars: 12000,
    mediaType: 'both',
    maxImages: 5,
    maxVideos: 1,
    imageRatios: ['*'],
    videoRatios: ['*'],
    maxVideoDurationSec: 600,
    allowCarousel: false,
    notes: ['Rich text formatting supported', 'Max 5 file attachments', 'Video hosted externally']
  },
  gmb: {
    id: 'gmb',
    label: 'Google My Business',
    maxChars: 1500,
    mediaType: 'both',
    maxImages: 10,
    maxVideos: 1,
    imageRatios: ['16:9', '4:3', '1:1'],
    videoRatios: ['16:9', '4:3'],
    maxVideoDurationSec: 30,
    allowCarousel: true,
    notes: ['Video max 30s', 'Photos up to 10 per post', 'Posts expire after 7 days']
  },
}

export function getPlatformConstraint(id: string): PlatformConstraints {
  return PLATFORM_CONSTRAINTS[id] || {
    id,
    label: id,
    maxChars: 999999,
    mediaType: 'both',
    maxImages: 999,
    maxVideos: 999,
    imageRatios: ['*'],
    videoRatios: ['*'],
    maxVideoDurationSec: 999999,
    allowCarousel: false,
    notes: []
  }
}

export interface MediaInfo {
  url: string
  type: 'image' | 'video'
  width?: number
  height?: number
  duration?: number
}

export function getPlatformWarnings(
  platformId: string,
  caption: string,
  media: MediaInfo[]
): string[] {
  const c = getPlatformConstraint(platformId)
  const warnings: string[] = []

  if (caption.length > c.maxChars) {
    warnings.push(`Caption exceeds ${c.maxChars} character limit (${caption.length}/${c.maxChars})`)
  }

  if (media.length === 0 && c.mediaType !== 'none') {
    if (c.mediaType === 'video') {
      warnings.push('Video required for this platform')
    }
    return warnings
  }

  if (c.mediaType === 'none') {
    warnings.push('This platform does not support media attachments')
    return warnings
  }

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')

  if (c.maxImages === 0 && images.length > 0) {
    warnings.push(`${c.label} does not support image attachments`)
  } else if (images.length > c.maxImages) {
    warnings.push(`Too many images (${images.length}/${c.maxImages} max)`)
  }

  if (c.maxVideos === 0 && videos.length > 0) {
    warnings.push(`${c.label} does not support video attachments`)
  } else if (videos.length > c.maxVideos) {
    warnings.push(`Too many videos (${videos.length}/${c.maxVideos} max)`)
  }

  if (c.mediaType === 'video' && videos.length === 0) {
    warnings.push(`Video required for ${c.label}`)
  }

  if (c.allowCarousel && images.length > 1 && videos.length > 0) {
    warnings.push('Carousel with mixed image/video not supported')
  }

  return warnings
}
