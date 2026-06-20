# AI Agent Development Prompt 2: Social Media OAuth, Channels & Post Scheduling Queue

## Goal
Implement secure OAuth 2.0 connection flows for social media platforms (X/Twitter, Instagram Graph API, LinkedIn, YouTube, TikTok) and a robust background scheduling system (BullMQ/Redis) to automatically publish posts at scheduled times.

---

## 1. System Context & Existing Routes
- **Channels Page (`/channels`)**: Shows connection states for X, LinkedIn, Instagram, YouTube, and TikTok. Users can click "Connect" to link their accounts.
- **Compose Page (`/compose`)**: Text editor, file attachment picker, platform selector checkboxes, scheduling date/time selector, and a "Schedule Post" or "Publish Now" button.
- **Calendar Page (`/calendar`)**: Renders scheduled and published posts on a calendar view. Supports moving posts to change scheduled dates.

---

## 2. Database Schema Extension
Add the following models to `schema.prisma` to support connected accounts, scheduled posts, and publish logs:

```prisma
enum PlatformType {
  INSTAGRAM
  X
  LINKEDIN
  YOUTUBE
  TIKTOK
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
}

model SocialAccount {
  id                String       @id @default(uuid())
  workspaceId       String
  platform          PlatformType
  platformAccountId String       // Remote platform account ID
  username          String
  displayName       String?
  avatarUrl         String?
  accessToken       String       // Encrypted in database
  refreshToken      String?      // Encrypted in database
  tokenExpiresAt    DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // Relations
  workspace         Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  posts             SocialAccountPost[]

  @@unique([workspaceId, platform, platformAccountId])
}

model Post {
  id          String              @id @default(uuid())
  userId      String
  workspaceId String
  content     String?             @db.Text
  mediaUrls   String[]            // Array of cloud storage file URLs
  scheduledAt DateTime?
  status      PostStatus          @default(DRAFT)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  // Relations
  user        User                @relation(fields: [userId], references: [id])
  workspace   Workspace           @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  accounts    SocialAccountPost[]
}

// Junction table to link posts to target accounts
model SocialAccountPost {
  postId          String
  socialAccountId String
  status          PostStatus          @default(SCHEDULED)
  publishedUrl    String?             // Link to the published post on the live platform
  errorMessage    String?
  publishedAt     DateTime?

  post            Post                @relation(fields: [postId], references: [id], onDelete: Cascade)
  socialAccount   SocialAccount       @relation(fields: [socialAccountId], references: [id], onDelete: Cascade)

  @@id([postId, socialAccountId])
}
```

---

## 3. OAuth 2.0 Connection API Flows
Implement standard OAuth 2.0 authorize & callback routes for each social network:
- `/api/oauth/:platform/connect`: Redirects user to the social platform authorization page with proper scopes.
- `/api/oauth/:platform/callback`: Receives authentication code, exchanges it for access/refresh tokens, fetches profile info, encrypts tokens, and stores them in the `SocialAccount` model.

### Platform Scopes
- **LinkedIn**: `w_member_social` (Publishing), `openid`, `profile`, `email`.
- **X (Twitter)**: `tweet.read`, `tweet.write`, `users.read`, `offline.access` (OAuth 2.0).
- **Instagram Graph API**: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
- **TikTok**: `video.publish`, `user.info.basic`.
- **YouTube (Google OAuth)**: `https://www.googleapis.com/auth/youtube.upload`, `https://www.googleapis.com/auth/youtube.readonly`.

> [!IMPORTANT]
> Encrypt all access and refresh tokens at rest in PostgreSQL. Use `aes-256-gcm` (via Node.js `crypto` module) with a secret key defined in the environment variables (`ENCRYPTION_KEY`).

---

## 4. Post Composer & Scheduling APIs
- `GET /api/posts`: List all posts (filter by status, workspace, date range). Used by the `/calendar` and `/` dashboard.
- `POST /api/posts`: Create a new post. Accept `content`, `mediaUrls`, list of `socialAccountIds`, and `scheduledAt`.
- `PATCH /api/posts/:id`: Update content or reschedule date/time (used for drag-and-drop on the calendar).
- `POST /api/posts/:id/publish`: Publish post immediately (bypassing scheduler queue).

---

## 5. Background Scheduling Queue Setup
Use **BullMQ** with **Redis** to execute publishing jobs:
1. **Initialize Queue**: Define a `post-publishing` queue.
2. **Cron/Scheduler Polling**: Set up a recurring worker (every 60 seconds) or schedule a specific BullMQ job to run at `scheduledAt`.
   - Alternatively, when a post is scheduled at `T`, add a BullMQ job with a delay: `delay = T - Date.now()`.
3. **Queue Job Worker**:
   - Updates Post status in DB to `PUBLISHING`.
   - Decrypts the target platform's `accessToken`. (Checks token expiry, runs refresh token flow if required).
   - Invokes platform-specific API Client (SDK or REST endpoint) with text payload and media files.
   - On success: Saves `publishedUrl`, sets status to `PUBLISHED`, and logs timestamp.
   - On failure: Logs error message and sets status to `FAILED`.

---

## 6. Verification & Definition of Done
- [ ] OAuth flow works for at least one platform (e.g., LinkedIn or X) and successfully registers a `SocialAccount` record.
- [ ] Scheduling a post from `/compose` writes records in `Post` and `SocialAccountPost` with `SCHEDULED` status.
- [ ] Rescheduling a post by dragging it on `/calendar` calls the API and updates `scheduledAt` in the DB.
- [ ] A background worker successfully picks up scheduled posts, invokes mock/sandbox API endpoints, handles token decryption, and records either success or failure details.
- [ ] Token encryption/decryption functions have unit test coverage.
