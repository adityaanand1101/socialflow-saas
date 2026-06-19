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

// ───── Content Types ─────

export interface SelectOption {
  value: string
  label: string
}

export interface ContentField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'number' | 'date' | 'multiline-list' | 'select'
  maxLength?: number
  required: boolean
  placeholder: string
  options?: string[] | SelectOption[]
  fieldNote?: string
}

export interface ContentTypeDef {
  id: string
  label: string
  fields: ContentField[]
  imageRatios: string[]
  videoRatios: string[]
  maxImages: number
  maxVideos: number
  maxChars: number
  mediaType: 'image' | 'video' | 'mixed' | 'none' | 'both'
  allowCarousel: boolean
}

function ct(id: string, label: string, fields: ContentField[], opts?: Partial<ContentTypeDef>): ContentTypeDef {
  return {
    id,
    label,
    fields,
    imageRatios: ['*'],
    videoRatios: ['*'],
    maxImages: 999,
    maxVideos: 999,
    maxChars: 999999,
    mediaType: 'both',
    allowCarousel: false,
    ...opts,
  }
}

const f = (key: string, label: string, type: ContentField['type'] = 'textarea', opts?: Partial<ContentField>): ContentField => ({
  key, label, type, required: true, placeholder: '', maxLength: undefined, ...opts
})

export const PLATFORM_CONTENT_TYPES: Record<string, ContentTypeDef[]> = {
  instagram: [
    ct('feed', 'Feed Post', [f('caption', 'Caption', 'textarea', { maxLength: 2200, placeholder: 'Write a caption...' }), f('location_id', 'Location ID', 'text', { required: false, placeholder: 'Facebook location page ID...' }), f('user_tags', 'User Tags (comma-separated usernames)', 'text', { required: false, placeholder: '@user1, @user2' })], {
      imageRatios: ['1:1', '4:5', '1.91:1'], videoRatios: ['1:1', '4:5', '16:9', '9:16'], maxImages: 1, maxVideos: 1, maxChars: 2200,
    }),
    ct('reel', 'Reel', [f('caption', 'Caption', 'textarea', { maxLength: 2200, placeholder: 'Write a caption...' }), f('audio_name', 'Audio/Music', 'text', { required: false, placeholder: 'Audio track name (Instagram Music)...' })], {
      imageRatios: [], videoRatios: ['9:16'], maxImages: 0, maxVideos: 1, maxChars: 2200, mediaType: 'video',
    }),
    ct('carousel', 'Carousel', [f('caption', 'Caption', 'textarea', { maxLength: 2200, placeholder: 'Write a caption...' })], {
      imageRatios: ['1:1', '4:5', '1.91:1'], videoRatios: ['1:1', '4:5', '16:9', '9:16'], maxImages: 10, maxVideos: 10, maxChars: 2200, allowCarousel: true,
    }),
    ct('story', 'Story', [], { imageRatios: ['9:16'], videoRatios: ['9:16'], maxImages: 1, maxVideos: 1, mediaType: 'mixed' }),
  ],
  facebook: [
    ct('feed', 'Feed Post', [f('message', 'Message', 'textarea', { maxLength: 63206, placeholder: "What's on your mind?" }), f('scheduled_publish_time', 'Schedule (Unix timestamp)', 'number', { required: false, placeholder: '1718000000', fieldNote: 'Leave empty for immediate publish' })], {
      imageRatios: ['4:5', '1:1', '1.91:1'], videoRatios: ['4:5', '9:16'], maxImages: 30, maxVideos: 1, maxChars: 63206,
    }),
    ct('reels', 'Reel', [f('message', 'Message', 'textarea', { maxLength: 63206, placeholder: 'Add a description...' }), f('scheduled_publish_time', 'Schedule (Unix timestamp)', 'number', { required: false, placeholder: '1718000000', fieldNote: 'Leave empty for immediate publish' })], {
      imageRatios: ['9:16'], videoRatios: ['9:16'], maxImages: 0, maxVideos: 1, maxChars: 2200, mediaType: 'video',
    }),
    ct('link', 'Link Share', [f('message', 'Message', 'textarea', { placeholder: 'Say something about this link...' }), f('url', 'URL', 'url', { required: true, placeholder: 'https://...' })], {
      maxImages: 1, imageRatios: ['1.91:1'], maxChars: 63206,
    }),
  ],
  x: [
    ct('post', 'Post', [f('text', 'Text', 'textarea', { maxLength: 280, placeholder: "What's happening?" })], {
      imageRatios: ['16:9', '1:1', '4:3'], videoRatios: ['16:9', '1:1'], maxImages: 4, maxVideos: 1, maxChars: 280,
    }),
    ct('poll', 'Poll', [
      f('text', 'Question', 'textarea', { maxLength: 280, placeholder: 'Ask a question...' }),
      f('poll_options', 'Poll Options', 'multiline-list', { placeholder: 'One option per line\nMax 4 options', fieldNote: 'Enter each option on a new line (max 4)' }),
      f('poll_duration_minutes', 'Duration (minutes)', 'number', { placeholder: '1440', fieldNote: 'Between 5 and 10080 minutes (7 days)' }),
    ], {
      maxChars: 280, maxImages: 0, maxVideos: 0, mediaType: 'none',
    }),
  ],
  linkedin: [
    ct('text', 'Text Post', [f('commentary', 'Commentary', 'textarea', { maxLength: 3000, placeholder: 'Share your professional updates...' })], {
      maxChars: 3000, maxImages: 0, maxVideos: 0,
    }),
    ct('image', 'Image Post', [f('commentary', 'Commentary', 'textarea', { maxLength: 3000, placeholder: 'Add a description...' })], {
      imageRatios: ['1:1', '16:9', '4:3'], maxImages: 20, maxChars: 3000,
    }),
    ct('video', 'Video Post', [f('commentary', 'Commentary', 'textarea', { maxLength: 3000, placeholder: 'Add a description...' })], {
      videoRatios: ['16:9', '1:1'], maxVideos: 1, maxChars: 3000, mediaType: 'video',
    }),
    ct('article', 'Article', [
      f('title', 'Title', 'text', { maxLength: 200, placeholder: 'Article headline...' }),
      f('description', 'Description', 'textarea', { maxLength: 3000, placeholder: 'Article description...' }),
      f('article_thumbnail_url', 'Thumbnail URL', 'url', { required: false, placeholder: 'https://...' }),
    ], {
      imageRatios: ['1.91:1'], maxImages: 1, maxChars: 100000,
    }),
    ct('poll', 'Poll', [
      f('commentary', 'Commentary', 'textarea', { maxLength: 3000, placeholder: 'Ask your network...' }),
      f('poll_options', 'Poll Options', 'multiline-list', { placeholder: 'One option per line\nMax 4 options', fieldNote: 'Enter each option on a new line' }),
      f('poll_duration_days', 'Duration (days)', 'number', { placeholder: '7', fieldNote: 'How many days should the poll run?' }),
    ], {
      maxChars: 3000, maxImages: 0, maxVideos: 0,
    }),
    ct('multi_image', 'Multi-Image', [f('commentary', 'Commentary', 'textarea', { maxLength: 3000, placeholder: 'Add a description...' })], {
      imageRatios: ['1:1', '16:9', '4:3'], maxImages: 20, maxChars: 3000, allowCarousel: true,
    }),
    ct('document', 'Document Post', [f('commentary', 'Commentary', 'textarea', { maxLength: 3000, placeholder: 'Add a description...' }), f('document_url', 'Document URL', 'url', { required: true, placeholder: 'https://example.com/doc.pdf', fieldNote: 'PDF, DOC, or PPT up to 100MB' })], {
      maxChars: 3000,
    }),
  ],
  threads: [
    ct('text', 'Text Post', [f('text', 'Text', 'textarea', { maxLength: 500, placeholder: "What's on your mind?" })], {
      maxChars: 500, maxImages: 0, maxVideos: 0,
    }),
    ct('image', 'Image Post', [f('text', 'Text', 'textarea', { maxLength: 500, placeholder: 'Add a caption...' })], {
      imageRatios: ['1:1', '16:9', '4:5', '9:16'], maxImages: 1, maxChars: 500,
    }),
    ct('video', 'Video Post', [f('text', 'Text', 'textarea', { maxLength: 500, placeholder: 'Add a caption...' })], {
      videoRatios: ['16:9', '1:1', '9:16'], maxVideos: 1, maxChars: 500,
    }),
    ct('carousel', 'Carousel', [f('text', 'Text', 'textarea', { maxLength: 500, placeholder: 'Add a caption...' })], {
      imageRatios: ['1:1', '16:9', '4:5', '9:16'], maxImages: 20, maxVideos: 20, maxChars: 500, allowCarousel: true,
    }),
  ],
  youtube: [
    ct('longform', 'Video', [f('title', 'Title', 'text', { maxLength: 100, placeholder: 'Video title...' }), f('description', 'Description', 'textarea', { maxLength: 5000, placeholder: 'Video description...' })], {
      imageRatios: ['16:9'], videoRatios: ['16:9'], maxImages: 0, maxVideos: 1, maxChars: 5000, mediaType: 'video',
    }),
    ct('shorts', 'Short', [f('title', 'Title', 'text', { maxLength: 100, placeholder: 'Short title...' }), f('description', 'Description', 'textarea', { maxLength: 5000, placeholder: 'Description...' })], {
      videoRatios: ['9:16'], maxImages: 0, maxVideos: 1, maxChars: 5000, mediaType: 'video',
    }),
    ct('community_post', 'Community Post', [f('body', 'Body', 'textarea', { maxLength: 5000, placeholder: 'Share an update with your community...' })], {
      maxChars: 5000, maxImages: 10, maxVideos: 0,
    }),
    ct('community_poll', 'Community Poll', [
      f('poll_question', 'Question', 'textarea', { maxLength: 5000, placeholder: 'Ask your community...' }),
      f('poll_options', 'Poll Options', 'multiline-list', { placeholder: 'One option per line\nMax 4 options', fieldNote: 'Enter each option on a new line (max 4)' }),
    ], {
      maxChars: 5000, maxImages: 10, maxVideos: 0,
    }),
  ],
  pinterest: [
    ct('standard_pin', 'Standard Pin', [f('title', 'Title', 'text', { maxLength: 100, placeholder: 'Pin title...' }), f('description', 'Description', 'textarea', { maxLength: 500, placeholder: 'Pin description...' }), f('link', 'Destination Link', 'url', { placeholder: 'https://...' })], {
      imageRatios: ['2:3', '1:1', '1:3.5'], maxImages: 1, maxChars: 500, mediaType: 'image',
    }),
    ct('video_pin', 'Video Pin', [f('title', 'Title', 'text', { maxLength: 100, placeholder: 'Pin title...' }), f('description', 'Description', 'textarea', { maxLength: 500, placeholder: 'Pin description...' }), f('link', 'Destination Link', 'url', { placeholder: 'https://...' })], {
      videoRatios: ['2:3', '9:16'], maxVideos: 1, maxChars: 500,
    }),
    ct('carousel_pin', 'Carousel Pin', [f('title', 'Title', 'text', { maxLength: 100, placeholder: 'Pin title...' }), f('description', 'Description', 'textarea', { maxLength: 500, placeholder: 'Pin description...' }), f('link', 'Destination Link', 'url', { placeholder: 'https://...' })], {
      imageRatios: ['2:3', '1:1'], maxImages: 5, maxChars: 500,
    }),
  ],
  reddit: [
    ct('text', 'Text Post', [
      f('subreddit', 'Subreddit', 'text', { required: true, placeholder: 'subreddit name (without r/)' }),
      f('title', 'Title', 'text', { maxLength: 300, placeholder: 'Post title...' }),
      f('body', 'Body', 'textarea', { placeholder: 'Post content (optional)...' }),
      f('flair_id', 'Flair ID', 'text', { required: false, placeholder: 'Optional flair ID...' }),
    ], {
      maxChars: 40000, maxImages: 0, maxVideos: 0,
    }),
    ct('link', 'Link Post', [
      f('subreddit', 'Subreddit', 'text', { required: true, placeholder: 'subreddit name (without r/)' }),
      f('title', 'Title', 'text', { maxLength: 300, placeholder: 'Post title...' }),
      f('url', 'URL', 'url', { required: true, placeholder: 'https://...' }),
      f('flair_id', 'Flair ID', 'text', { required: false, placeholder: 'Optional flair ID...' }),
    ], {
      maxChars: 300, maxImages: 0, maxVideos: 0,
    }),
    ct('image', 'Image Post', [
      f('subreddit', 'Subreddit', 'text', { required: true, placeholder: 'subreddit name (without r/)' }),
      f('title', 'Title', 'text', { maxLength: 300, placeholder: 'Post title...' }),
      f('flair_id', 'Flair ID', 'text', { required: false, placeholder: 'Optional flair ID...' }),
    ], {
      maxImages: 1, maxChars: 300,
    }),
  ],
  wordpress: [
    ct('post', 'Post', [f('title', 'Title', 'text', { placeholder: 'Post title...' }), f('body', 'Body', 'textarea', { placeholder: 'Write your post...' }), f('excerpt', 'Excerpt', 'textarea', { maxLength: 500, required: false, placeholder: 'Post excerpt (optional)...' }), f('categories', 'Categories (IDs, comma-separated)', 'text', { required: false, placeholder: 'e.g. 1, 2, 3' }), f('tags', 'Tags (IDs, comma-separated)', 'text', { required: false, placeholder: 'e.g. 4, 5, 6' }), f('slug', 'Slug', 'text', { required: false, placeholder: 'custom-url-slug' })], {
      maxChars: 100000, maxImages: 999, maxVideos: 999,
    }),
  ],
  discord: [
    ct('message', 'Simple Message', [f('content', 'Content', 'textarea', { maxLength: 2000, placeholder: 'Type your message...' }), f('thread_name', 'Thread Name', 'text', { required: false, placeholder: 'Start a thread with this name...' }), f('webhook_username', 'Bot Name', 'text', { required: false, placeholder: 'Custom username (override)' }), f('webhook_avatar', 'Bot Avatar URL', 'url', { required: false, placeholder: 'https://...' })], {
      maxChars: 2000, maxImages: 10, maxVideos: 1,
    }),
    ct('embed', 'Rich Embed', [
      f('content', 'Fallback Text', 'textarea', { maxLength: 2000, required: false, placeholder: 'Notification fallback text...' }),
      f('embed_title', 'Embed Title', 'text', { maxLength: 256, required: false, placeholder: 'Embed title...' }),
      f('embed_description', 'Embed Description', 'textarea', { maxLength: 4096, required: false, placeholder: 'Embed description...' }),
      f('embed_color', 'Embed Color', 'text', { maxLength: 7, required: false, placeholder: '#FF0000' }),
      f('embed_url', 'Embed URL', 'url', { required: false, placeholder: 'https://...' }),
      f('embed_image', 'Image URL', 'url', { required: false, placeholder: 'https://...' }),
      f('embed_thumbnail', 'Thumbnail URL', 'url', { required: false, placeholder: 'https://...' }),
      f('thread_name', 'Thread Name', 'text', { required: false, placeholder: 'Start a thread with this name...' }),
      f('webhook_username', 'Bot Name', 'text', { required: false, placeholder: 'Custom username (override)' }),
      f('webhook_avatar', 'Bot Avatar URL', 'url', { required: false, placeholder: 'https://...' }),
    ], {
      maxChars: 2000, maxImages: 10, maxVideos: 1, mediaType: 'both',
    }),
  ],
  telegram: [
    ct('text', 'Text Message', [f('text', 'Text', 'textarea', { maxLength: 4096, placeholder: 'Type your message...' }), f('parse_mode', 'Parse Mode', 'select', { options: [{ value: '', label: 'None (plain text)' }, { value: 'HTML', label: 'HTML' }, { value: 'MarkdownV2', label: 'MarkdownV2' }], required: false })], {
      maxChars: 4096, maxImages: 0, maxVideos: 0,
    }),
    ct('photo', 'Photo', [f('caption', 'Caption', 'textarea', { maxLength: 1024, placeholder: 'Photo caption...' }), f('parse_mode', 'Parse Mode', 'select', { options: [{ value: '', label: 'None (plain text)' }, { value: 'HTML', label: 'HTML' }, { value: 'MarkdownV2', label: 'MarkdownV2' }], required: false })], {
      maxImages: 1, maxChars: 1024,
    }),
    ct('video', 'Video', [f('caption', 'Caption', 'textarea', { maxLength: 1024, placeholder: 'Video caption...' }), f('parse_mode', 'Parse Mode', 'select', { options: [{ value: '', label: 'None (plain text)' }, { value: 'HTML', label: 'HTML' }, { value: 'MarkdownV2', label: 'MarkdownV2' }], required: false })], {
      maxVideos: 1, maxChars: 1024, mediaType: 'video',
    }),
    ct('media_group', 'Album', [f('text', 'Caption', 'textarea', { maxLength: 1024, placeholder: 'Album caption...' }), f('parse_mode', 'Parse Mode', 'select', { options: [{ value: '', label: 'None (plain text)' }, { value: 'HTML', label: 'HTML' }, { value: 'MarkdownV2', label: 'MarkdownV2' }], required: false })], {
      maxImages: 10, maxVideos: 10, maxChars: 1024,
    }),
    ct('poll', 'Poll', [f('question', 'Question', 'text', { maxLength: 300, placeholder: 'Ask a question...' }), f('poll_options', 'Options', 'multiline-list', { placeholder: 'One option per line' }), f('is_anonymous', 'Anonymous', 'select', { options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], required: false }), f('allows_multiple_answers', 'Allow Multiple Answers', 'select', { options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], required: false })], {
      maxChars: 300, maxImages: 0, maxVideos: 0, mediaType: 'none',
    }),
  ],
  slack: [
    ct('message', 'Simple Message', [f('text', 'Text', 'textarea', { maxLength: 4000, placeholder: 'Type your message...' }), f('thread_ts', 'Thread Reply (timestamp)', 'text', { required: false, placeholder: 'Thread parent timestamp e.g. 1718000000.123456' })], {
      maxChars: 4000, maxImages: 5, maxVideos: 1,
    }),
    ct('blocks', 'Rich Blocks', [
      f('text', 'Notification Text', 'textarea', { maxLength: 4000, required: false, placeholder: 'Fallback text for notifications...' }),
      f('blocks_json', 'Blocks JSON', 'textarea', { required: false, placeholder: 'Paste Slack Block Kit JSON here...', fieldNote: 'Use app.slack.com/block-kit-builder to create blocks' }),
      f('thread_ts', 'Thread Reply (timestamp)', 'text', { required: false, placeholder: 'Thread parent timestamp e.g. 1718000000.123456' }),
    ], {
      maxChars: 4000, maxImages: 5, maxVideos: 1,
    }),
  ],
  bluesky: [
    ct('text', 'Text Post', [f('text', 'Text', 'textarea', { maxLength: 300, placeholder: "What's up?" })], {
      maxChars: 300, maxImages: 0, maxVideos: 0,
    }),
    ct('image', 'Image Post', [
      f('text', 'Text', 'textarea', { maxLength: 300, placeholder: 'What\'s up?' }),
      f('alt_text', 'Alt Text', 'text', { maxLength: 1000, required: false, placeholder: 'Image description for accessibility...' }),
    ], {
      maxImages: 4, maxChars: 300,
    }),
    ct('video', 'Video Post', [f('text', 'Text', 'textarea', { maxLength: 300, placeholder: 'Add alt text...' })], {
      maxVideos: 1, maxChars: 300, mediaType: 'video',
    }),
  ],
  mastodon: [
    ct('text', 'Text Post', [f('text', 'Status', 'textarea', { maxLength: 500, placeholder: "What's on your mind?" }), f('content_warning', 'Content Warning', 'text', { required: false, placeholder: 'CW (optional)...' })], {
      maxChars: 500, maxImages: 0, maxVideos: 0,
    }),
    ct('poll', 'Poll', [f('text', 'Question', 'textarea', { maxLength: 500, placeholder: 'Ask a question...' }), f('content_warning', 'Content Warning', 'text', { required: false, placeholder: 'CW (optional)...' }), f('poll_options', 'Poll Options', 'multiline-list', { placeholder: 'One option per line\nMax 4 options', fieldNote: 'Enter each option on a new line (max 4)' }), f('poll_expires_in', 'Duration (seconds)', 'number', { placeholder: '86400', fieldNote: 'How many seconds should the poll run? (min 300)' })], {
      maxChars: 500, maxImages: 0, maxVideos: 0, mediaType: 'none',
    }),
    ct('media', 'Media Post', [f('text', 'Status', 'textarea', { maxLength: 500, placeholder: 'Add a description...' }), f('content_warning', 'Content Warning', 'text', { required: false, placeholder: 'CW (optional)...' }), f('alt_text', 'Alt Text', 'text', { maxLength: 1000, required: false, placeholder: 'Image description for accessibility (applied to all media)...' })], {
      maxImages: 4, maxVideos: 1, maxChars: 500,
    }),
  ],
  tumblr: [
    ct('text', 'Text Post', [f('title', 'Title', 'text', { placeholder: 'Post title...' }), f('body', 'Body', 'textarea', { placeholder: 'Write your post...' })], {
      maxChars: 10000,
    }),
    ct('photo', 'Photo Post', [f('body', 'Caption', 'textarea', { placeholder: 'Photo caption...' })], {
      maxImages: 10, maxChars: 10000,
    }),
    ct('quote', 'Quote Post', [f('text', 'Quote', 'textarea', { placeholder: 'Quote text...' }), f('source', 'Source', 'text', { required: false, placeholder: 'Source (optional)...' })], {
      maxChars: 10000, mediaType: 'none',
    }),
    ct('link', 'Link Post', [f('url', 'URL', 'url', { required: true, placeholder: 'https://...' }), f('title', 'Title', 'text', { required: false, placeholder: 'Link title (optional)...' }), f('description', 'Description', 'textarea', { required: false, placeholder: 'Link description (optional)...' })], {
      maxChars: 10000, mediaType: 'none',
    }),
    ct('video', 'Video Post', [f('body', 'Caption', 'textarea', { required: false, placeholder: 'Video caption...' })], {
      maxVideos: 1, maxChars: 10000,
    }),
    ct('audio', 'Audio Post', [f('body', 'Caption', 'textarea', { required: false, placeholder: 'Audio caption...' })], {
      maxImages: 0, maxVideos: 0, maxChars: 10000,
    }),
    ct('chat', 'Chat Post', [f('title', 'Title', 'text', { required: false, placeholder: 'Chat title...' }), f('body', 'Conversation', 'textarea', { placeholder: 'Paste conversation text...' })], {
      maxChars: 10000, mediaType: 'none',
    }),
  ],
  gmb: [
    ct('update', 'Update', [f('summary', 'Text', 'textarea', { maxLength: 1500, placeholder: 'Share an update...' })], {
      maxChars: 1500, maxImages: 10, maxVideos: 1,
    }),
    ct('event', 'Event', [
      f('summary', 'Description', 'textarea', { maxLength: 1500, placeholder: 'Event description...' }),
      f('event_title', 'Event Title', 'text', { required: true, placeholder: 'Grand Opening...' }),
      f('event_start_date', 'Start Date', 'date', { required: true, placeholder: '2025-12-31' }),
      f('event_end_date', 'End Date', 'date', { required: true, placeholder: '2026-01-01' }),
      f('event_start_time', 'Start Time', 'text', { required: false, placeholder: '09:00' }),
      f('event_end_time', 'End Time', 'text', { required: false, placeholder: '17:00' }),
    ], {
      maxChars: 1500, maxImages: 10, maxVideos: 0,
    }),
    ct('offer', 'Offer', [
      f('summary', 'Offer Details', 'textarea', { maxLength: 1500, placeholder: 'Offer details...' }),
      f('call_to_action', 'CTA Button', 'text', { placeholder: 'Learn More' }),
      f('coupon_code', 'Coupon Code', 'text', { required: false, placeholder: 'BOGO2025' }),
      f('redeem_url', 'Redeem URL', 'url', { required: false, placeholder: 'https://...' }),
      f('terms_conditions', 'Terms & Conditions', 'textarea', { required: false, placeholder: 'Terms and conditions...' }),
      f('end_date', 'End Date', 'date', { required: true, placeholder: '2025-12-31' }),
    ], {
      maxChars: 1500, maxImages: 1,
    }),
    ct('alert', 'Alert', [
      f('summary', 'Alert Text', 'textarea', { maxLength: 1500, placeholder: 'Alert message...' }),
      f('alert_type', 'Alert Type', 'text', { required: false, placeholder: 'COVID_19, WEATHER, or OTHER' }),
      f('call_to_action', 'CTA Button', 'text', { required: false, placeholder: 'Learn More' }),
      f('url', 'Link URL', 'url', { required: false, placeholder: 'https://...' }),
    ], {
      maxChars: 1500, maxImages: 0, mediaType: 'none',
    }),
  ],
}

export function getContentTypes(platformId: string): ContentTypeDef[] {
  return PLATFORM_CONTENT_TYPES[platformId] || []
}

export function getContentType(platformId: string, typeId: string): ContentTypeDef | undefined {
  const types = getContentTypes(platformId)
  return types.find(t => t.id === typeId) || types[0]
}

export function getDefaultContentType(platformId: string): string {
  const types = getContentTypes(platformId)
  return types[0]?.id || 'default'
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
