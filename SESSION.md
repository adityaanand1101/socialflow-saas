# SocialFlow Session State

> Created 2026-06-19 — tracks progress across chat compaction / new windows

## What's Done

### Phase 1 — Content Type Editor (Frontend) COMPLETE
- [x] `ContentField.type` expanded: `'number' | 'date' | 'multiline-list'` added
- [x] `ContentField.fieldNote` helper text support
- [x] Platform constraints fixed:
  - X Poll: `poll_options` + `poll_duration_minutes`
  - LinkedIn: Poll + Multi-Image types; Article got `article_thumbnail_url`
  - Reddit: `subreddit` (required) + `flair_id` on all 3 types
  - Discord: `embed` content type (title, description, color, URL, image, thumbnail)
  - Slack: `blocks_json` content type
  - GMB: `event` content type (start/end dates/times); Offer expanded (`coupon_code`, `redeem_url`, `terms_conditions`)
  - YouTube: `community_poll` content type
  - Bluesky: `alt_text` on Image Post
- [x] `Compose.tsx` field renderer handles all new field types + `fieldNote`
- [x] All 16 `PlatformPreviews.tsx` render structured fields

### Phase 2 — Publisher Refactors COMPLETE
- [x] `Publisher` type accepts `structuredContent` + `postTypes`
- [x] `publishToPlatform()` passes them through
- [x] Prisma schema: `Post.structuredContent` (Json) + `Post.postTypes` (Json)
- [x] `POST /api/posts` accepts & stores `structuredContent`/`postTypes`
- [x] `PATCH /api/posts/:id` accepts & stores `structuredContent`/`postTypes`
- [x] `queue.ts` passes structuredContent/postTypes when calling publishers
- [x] **LinkedIn**: Migrated from deprecated UGC Posts API + Assets API to new Posts API (202603) + Images API. Supports Article, Poll, Multi-Image, text, image, video content types
- [x] **Facebook**: Added Link share type (with `url` field), Reels type (`/video_reels` endpoint), structured `message`/`url` support
- [x] **Instagram**: Added Reel type (`REELS` media type), Story type support, video processing polling (instead of 5s hardcoded delay), structured `caption` support
- [x] **Twitter**: Added Poll support (`poll.options`, `poll.duration_minutes`), video/GIF processing polling via `STATUS` command, `tweet_gif` media category

### Phase 3-5 — New Publishers (TODO)
- [ ] Threads publisher
- [ ] YouTube publisher
- [ ] Reddit publisher
- [ ] Pinterest publisher
- [ ] WordPress publisher
- [ ] Discord publisher
- [ ] Telegram publisher
- [ ] Tumblr publisher
- [ ] Bluesky publisher
- [ ] Mastodon publisher
- [ ] Slack publisher
- [ ] GMB publisher

## Key Files

### Frontend
- `src/lib/platformConstraints.ts` — Content type definitions, constraints, helpers
- `src/pages/Compose.tsx` — Compose page with dynamic field editor
- `src/components/PlatformPreviews.tsx` — All 16 platform previews

### Backend
- `backend/prisma/schema.prisma` — Post model now has structuredContent + postTypes
- `backend/routes/posts.ts` — POST/PATCH accept structuredContent + postTypes
- `backend/utils/queue.ts` — Passes structured data to publishers
- `backend/utils/publishers/index.ts` — Updated Publisher type signature
- `backend/utils/publishers/{platform}.ts` — Per-platform publisher modules

## Next Commands

### Prisma migration (run once before testing backend):
```bash
cd backend && npx prisma migrate dev --name add-structured-content
```

### Build check:
```bash
cd frontend && npx tsc --noEmit && npx vite build
cd backend && npx tsc --noEmit
```
