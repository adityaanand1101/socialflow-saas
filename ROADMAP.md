# SocialFlow Multi-Content-Type Implementation Roadmap

## API Research Summary — What Each Platform Actually Supports

| Platform | Post Types (API) | Multi-Step Upload | Special Constraints |
|----------|-----------------|-------------------|---------------------|
| **Instagram** | Feed, Reel, Story, Carousel | Container→Publish (2-step) | 10 items/carousel, 5s video wait |
| **Facebook** | Feed, Reels, Link, Photo, Video | Single + multi-photo (2-step) | 10 photos/album, Graph API v18.0 |
| **X/Twitter** | Text, Poll, Image/Video/GIF | INIT→APPEND→FINALIZE (3-step) | 280 chars (basic), 25K (Pro), 4 images or 1 video, polls 5-10080 min |
| **LinkedIn** | Text, Image, Video, Article, MultiImage, Poll, Doc | RegisterUpload→Binary→Post (3-step) | **DEPRECATED API** — migrate to Posts API + Images API; 9 media max, article needs thumbnail URN |
| **YouTube** | Longform, Shorts, Community Post | videos.insert (single upload) | 256GB max, private by default for unverified apps, community posts use different API |
| **Threads** | Text, Image, Video, Carousel | Container→Publish (2-step, 3-step for carousel) | 500 chars, 250 posts/24h, 20 items/carousel, 30s video wait |
| **Pinterest** | Standard Pin, Video Pin | Image: single POST; Video: upload→create (2-step) | Title 100, description 800, link 2048, alt_text 500 |
| **Bluesky** | Text, Image (up to 4), External Embed | uploadBlob→createRecord (2-step) | 300 chars, 1MB/image, facets for links/mentions/tags |
| **Mastodon** | Text, Media, Poll, CW | media_post→status_post (2-step) | 500 chars, 4 media, spoiler_text CW, polls 4 options |
| **Reddit** | Text/Self, Link, Image, Gallery | Single POST /api/submit | Title 300 (immutable), body 40K, subreddit required, flair optional |
| **WordPress** | Post | media upload→featured_media→post (3-step) | title + content + featured_media, categories/tags |
| **Discord** | Message, Embed (up to 10), Files (up to 10) | Single POST (webhook) | 2000 chars content, 6000 total embed chars, 25MB files |
| **Telegram** | Text, Photo, Video, Document | Single method per type | 4096 chars text, 20MB files, 30 msg/s per chat |
| **Tumblr** | Text, Photo, Quote, Link, Chat, Audio, Video | NPF blocks (legacy POST also supported) | 4096 chars/text block, 1000 blocks/post, 1000 calls/h |
| **Slack** | Message, Blocks (rich text), Attachments | Single POST chat.postMessage | 4000 chars text, ~13200 blocks limit, 1 msg/s per channel |
| **GMB** | STANDARD, EVENT, OFFER, ALERT | Single POST localPosts | summary + topicType + event/offer data, schedule for events |

---

## 5-Phase Development Plan

### Phase 1: Foundation & Content Type Editor (Frontend)
**Goal:** The UI correctly captures all fields for every content type and sends them to the backend.

| Step | Description | Platforms | Files Affected |
|------|-------------|-----------|----------------|
| **1.1** | Fix content type definitions — add missing fields (X poll options/duration, LinkedIn article thumbnail, Reddit subreddit, Discord embeds, Slack blocks, GMB event/offer data) | All 16 | `platformConstraints.ts` |
| **1.2** | Add dynamic field renderers for special types (select, date, poll-options builder, multi-embed builder) | X, LinkedIn, Reddit, Discord, Slack, GMB | `Compose.tsx` |
| **1.3** | Add per-platform overrides for field maxLengths and validation | All 16 | `platformConstraints.ts`, `Compose.tsx` |
| **1.4** | Update PlatformPreviews.tsx for remaining 9 components (Instagram, X, Facebook, Threads, Discord, Telegram, Slack, Bluesky, Mastodon) to render structured fields | 9 platforms | `PlatformPreviews.tsx` |

### Phase 2: Publisher Backend — The Big 4 (Existing Refactor)
**Goal:** The 4 existing publishers work correctly with structured content and use current API versions.

| Step | Description | Platforms | Files Affected |
|------|-------------|-----------|----------------|
| **2.1** | **Refactor LinkedIn publisher** — migrate from deprecated UGC Posts API + Assets API to new Posts API + Images API. Add Article, MultiImage, Poll content types | LinkedIn | `backend/utils/publishers/linkedin.ts` |
| **2.2** | **Update Facebook publisher** — add Reels support, Link post type with URL, handle structured `message`/`url` fields | Facebook | `backend/utils/publishers/facebook.ts` |
| **2.3** | **Update Instagram publisher** — fix text-only post fallback, add Reel media type, add video processing polling instead of hardcoded 5s wait | Instagram | `backend/utils/publishers/instagram.ts` |
| **2.4** | **Update Twitter publisher** — add Poll support (`poll.options`, `poll.duration_minutes`), add video/GIF processing polling, fix 280-char truncation to respect tier | X/Twitter | `backend/utils/publishers/twitter.ts` |

### Phase 3: Publisher Backend — The Next 4 (New Implementations)
**Goal:** 4 new high-priority publishers go live: Threads, YouTube, Reddit, Pinterest.

| Step | Description | Platforms | Files Affected |
|------|-------------|-----------|----------------|
| **3.1** | **Threads publisher** — implement container→publish (2-step) for text/image/video, 3-step for carousel with up to 20 items | Threads | `backend/utils/publishers/threads.ts` |
| **3.2** | **YouTube publisher** — implement videos.insert for longform/shorts, separate community post API. Handle private-by-default restriction | YouTube | `backend/utils/publishers/youtube.ts` |
| **3.3** | **Reddit publisher** — implement POST /api/submit with kind=self/link/image, subreddit parameter, optional flair_id | Reddit | `backend/utils/publishers/reddit.ts` |
| **3.4** | **Pinterest publisher** — implement pins/create with media_source (image_url/image_base64/video_id). Add 2-step video pin flow | Pinterest | `backend/utils/publishers/pinterest.ts` |

### Phase 4: Publisher Backend — The Next 4 (Medium Priority)
**Goal:** 4 medium-priority publishers go live: WordPress, Discord, Telegram, Tumblr.

| Step | Description | Platforms | Files Affected |
|------|-------------|-----------|----------------|
| **4.1** | **WordPress publisher** — implement WP REST API POST /wp-json/wp/v2/posts with title/content/featured_media/categories/tags, media upload flow | WordPress | `backend/utils/publishers/wordpress.ts` |
| **4.2** | **Discord publisher** — implement webhook POST with content + embeds (title/description/fields/color/image) + file attachments via multipart | Discord | `backend/utils/publishers/discord.ts` |
| **4.3** | **Telegram publisher** — implement sendMessage/sendPhoto/sendVideo/sendMediaGroup with correct method selection based on content type | Telegram | `backend/utils/publishers/telegram.ts` |
| **4.4** | **Tumblr publisher** — implement POST /v2/blog/{blog}/post with type=text/photo/quote/link, NPF content blocks for rich posts | Tumblr | `backend/utils/publishers/tumblr.ts` |

### Phase 5: Publisher Backend — The Last 4 + Polish
**Goal:** Final 4 publishers + cross-cutting improvements.

| Step | Description | Platforms | Files Affected |
|------|-------------|-----------|----------------|
| **5.1** | **Bluesky publisher** — implement com.atproto.repo.createRecord with app.bsky.feed.post, uploadBlob for images, facets for links/mentions | Bluesky | `backend/utils/publishers/bluesky.ts` |
| **5.2** | **Mastodon publisher** — implement POST /api/v1/statuses with status/spoiler_text/media_ids/poll. Handle media_post (2-step) | Mastodon | `backend/utils/publishers/mastodon.ts` |
| **5.3** | **Slack publisher** — implement chat.postMessage with text + blocks (rich_text/section/header/divider) + file attachments | Slack | `backend/utils/publishers/slack.ts` |
| **5.4** | **GMB publisher** — implement POST /v4/accounts/{id}/locations/{id}/localPosts with STANDARD/EVENT/OFFER/ALERT topicTypes, event/offer sub-objects | GMB | `backend/utils/publishers/gmb.ts` |

---

## 7-Step Implementation Order (Execution Sequence)

This is the exact order of work, merging phases into a single execution sequence:

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1  │ Fix content type definitions + all field types    │
│          │ (platformConstraints.ts + Compose field renderers) │
├──────────────────────────────────────────────────────────────┤
│  STEP 2  │ Update PlatformPreviews.tsx — all 9 remaining     │
│          │ components render structured fields                │
├──────────────────────────────────────────────────────────────┤
│  STEP 3  │ Refactor existing 4 publishers for structured     │
│          │ content + current API versions (LinkedIn migrate!) │
├──────────────────────────────────────────────────────────────┤
│  STEP 4  │ Build Threads, YouTube, Reddit, Pinterest pubs    │
├──────────────────────────────────────────────────────────────┤
│  STEP 5  │ Build WordPress, Discord, Telegram, Tumblr pubs   │
├──────────────────────────────────────────────────────────────┤
│  STEP 6  │ Build Bluesky, Mastodon, Slack, GMB pubs          │
├──────────────────────────────────────────────────────────────┤
│  STEP 7  │ Polish — rate limiting, error handling, retry     │
│          │ logic, media processing polling, monitoring       │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Technical Decisions

### 1. Shared Publisher Pattern
All publishers follow this interface:
```ts
type Publisher = (
  token: string,
  content: string,                    // flat caption fallback
  mediaUrls: string[],                // remote URLs
  platformAccountId: string,
  structuredContent?: Record<string, string>,  // per-content-type fields
  contentTypeId?: string,             // e.g. "x-poll", "linkedin-article"
  options?: Record<string, any>       // platform-specific (subreddit, board_id, etc.)
) => Promise<PublishResult>
```

### 2. Media Processing
- **Synchronous** (Facebook, Threads, Pinterest images): URL passed in JSON body
- **Chunked upload** (Twitter, LinkedIn): Binary upload via init/append/finalize
- **Two-step** (Instagram, Threads video): Create container → poll status → publish
- **Upload blob** (Bluesky, Mastodon, WordPress): Upload binary → get ID → reference in post

### 3. API Versioning
- Meta (Instagram/Facebook/Threads): Graph API v18.0+ stays, add version header
- LinkedIn: Migrate to Posts API (2026 YYYYMM versioned headers)
- Google (YouTube/GMB): Use v3/v4 respectively
- All others: Latest stable API as of 2026

### 4. Content-Type Resolution Flow
```
User selects platforms → For each platform, user picks content type
  → UI renders type-specific fields
  → On publish, compose.tsx sends { structuredContent, postTypes, caption }
  → Backend publisher receives these + resolves which API method to call
  → Publisher maps structured fields → API parameters
  → Falls back to flat `content` (master caption) if structuredContent not provided
```

### 5. Error Handling & Retry
- Transient errors (rate limits, media processing): Exponential backoff, max 3 retries
- Permanent errors (invalid tokens, deleted accounts): Fail immediately with descriptive message
- Media processing polling (Twitter video, Instagram video): Poll at `check_after_secs` intervals
