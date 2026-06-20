# AI Agent Development Prompt 3: AI Studio Core & Cloud Media Library

## Goal
Implement AI-driven tools (Caption Generator, Hashtag Research, Content Ideas, AI Image Generator) in the AI Studio (`/ai-studio`) and connect the Media Library (`/media`) to a cloud storage provider (Backblaze B2 or AWS S3) for asset uploads and management.

---

## 1. System Context & Existing Routes
- **AI Studio Page (`/ai-studio`)**: Has cards for Caption Generator, Hashtag Research, Content Ideas, and AI Image Generator. Each contains inputs (prompts, selections) and displays output layouts.
- **Media Library Page (`/media`)**: Drag-and-drop grid list of images/videos, with search, tags, and delete actions. Users can also select assets directly from the post composer.

---

## 2. Technical Stack & Dependencies
- **AI Integration**: OpenAI Node SDK (or LangChain/Vercel AI SDK) for text and image models.
- **Cloud Storage**: AWS SDK S3 client (compatible with Backblaze B2, Cloudflare R2, or AWS S3).
- **Direct Uploads**: Client-side direct S3 uploads via server-signed URLs to reduce server load.

---

## 3. Database Schema Extensions
Add models for Media Assets and AI generation rate-limiting tracking in `schema.prisma`:

```prisma
model MediaAsset {
  id          String    @id @default(uuid())
  workspaceId String
  userId      String
  fileName    String
  fileUrl     String    // Public CDN URL of the media file
  fileType    String    // mime-type (e.g., 'image/png', 'video/mp4')
  fileSize    Int       // In bytes
  tags        String[]  // Searchable descriptors
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])

  @@index([workspaceId])
}

model AiGenerationLog {
  id             String   @id @default(uuid())
  userId         String
  toolUsed       String   // 'caption' | 'hashtag' | 'ideas' | 'image'
  prompt         String   @db.Text
  tokensUsed     Int?
  imagesGenerated Int?
  createdAt      DateTime @default(now())

  // Relations
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 4. Backend APIs to Implement

### AI Studio Endpoints
- `POST /api/ai/caption`:
  - **Inputs**: `prompt` (context), `tone` (professional, casual, funny, etc.), `platform` (X, LinkedIn, Instagram).
  - **Output**: JSON containing 3 variations of captions.
- `POST /api/ai/hashtags`:
  - **Inputs**: `niche` / `keywords`.
  - **Output**: List of top trending and contextually relevant hashtags.
- `POST /api/ai/ideas`:
  - **Inputs**: `topic` / `industry`.
  - **Output**: JSON listing a 30-day content plan (30 topics, brief description for each).
- `POST /api/ai/image`:
  - **Inputs**: `imagePrompt`, `aspectRatio`.
  - **Output**: DALL-E 3 generated image URL. Automatically downloads, uploads to S3, registers as a `MediaAsset`, and returns the S3 URL.

### Media Library Endpoints
- `POST /api/media/presigned-url`:
  - Generates a secure, temporary putObject command URL for the client.
  - **Inputs**: `fileName`, `fileType`, `fileSize`.
  - **Output**: `uploadUrl` (signed S3 URL) and the destination public `fileUrl`.
- `POST /api/media/register`:
  - Confirms file upload completion and creates a DB record.
  - **Inputs**: `fileName`, `fileUrl`, `fileType`, `fileSize`, `tags`.
- `GET /api/media`: Returns paginated list of media files in the current workspace with search filtering.
- `DELETE /api/media/:id`: Deletes resource record from database and issues S3 `deleteObject` call to clean up cloud storage.

---

## 5. Implementation Steps

### Step 1: AI Prompt Engineering & Model Connections
1. Use `gpt-4o-mini` (or equivalent) for text generations. Craft strict system prompts that force structured JSON responses (using JSON mode or Zod schemas).
2. For `/api/ai/caption`, ask for emoji placements, character constraints matching platform standards, and call-to-actions.
3. For `/api/ai/ideas`, structure the output exactly as:
   `{ "ideas": [ { "day": 1, "topic": "...", "description": "..." }, ... ] }`

### Step 2: S3-Compatible Storage Configuration
1. Setup a bucket on Backblaze B2, Cloudflare R2, or AWS S3.
2. Store credentials in `.env` (`S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`).
3. Set CORS policies on the bucket to allow PUT requests from the frontend domain.

### Step 3: Frontend Uploader Setup
1. In the frontend, intercept file picker uploads.
2. Request a signed URL from `/api/media/presigned-url`.
3. Upload files directly to S3 using an Axios/Fetch `PUT` request with `Content-Type` set correctly.
4. On `200 OK`, call `/api/media/register` to save metadata.

---

## 6. Verification & Definition of Done
- [ ] AI Text generators (/caption, /hashtags, /ideas) output valid JSON payloads to the frontend.
- [ ] AI Image generator successfully uploads output to the S3 bucket and automatically appends it to the Media Library.
- [ ] Users can upload files locally; files reside in B2/S3, and render correctly inside the `/media` layout.
- [ ] Deleting a file from the UI removes the database entry and deletes the actual file from S3 storage.
- [ ] Write mocks for OpenAI calls and S3 clients for unit tests.
