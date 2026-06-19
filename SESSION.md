# Session Plan — Complete All 15 Remaining Items

## Strategy
- Phase 1: All content type field + preview changes in shared files first (platformConstraints.ts, PlatformPreviews.tsx)
- Phase 2: Spawn parallel agents for independent publisher implementations
- Phase 3: Infrastructure (prisma, tests, deploy hook)
- Phase 4: Build verify + deploy

## Items
### High (Phase 1 — will fail or missing core features)
1. Instagram Reel: add polling before publish (currently publishes without waiting)
2. Mastodon: add native polls + alt text on media uploads
3. Telegram: add native polls + inline keyboards + MarkdownV2
4. Pinterest: add carousel pins (multiple_image_urls)
5. Bluesky: add facets (@mentions, #hashtags, link previews)
6. WordPress: add categories/tags/excerpt support

### Medium (Phase 1b — nice-to-haves)
7. Instagram Reel audio/music, location tagging, user tagging
8. LinkedIn document uploads and document carousel
9. Facebook scheduled publishing (scheduled_publish_time)
10. Discord thread/forum support, custom webhook name/avatar
11. Slack thread replies
12. Instagram Story media_type fix (no-op ternary)

### Low (Phase 2)
13. Run prisma migrate deploy on Render
14. Tests for publishers
15. Create Deploy Hook URL in Render dashboard
