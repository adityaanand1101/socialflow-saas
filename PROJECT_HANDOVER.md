# SocialFlow SaaS - Project Handover Document

## 1. Project Overview & Scope
**SocialFlow** is a multi-tenant Social Media Management SaaS. It allows users to connect multiple social media accounts, upload and organize media assets, and schedule posts across different platforms from a single unified dashboard.

**Core Capabilities:**
- **Multi-Tenancy:** Users are organized into "Workspaces". All data (Media, Posts, Social Accounts) is strictly partitioned by `workspaceId`.
- **OAuth Integration:** Secure connection to 16 different social platforms via OAuth 2.0 (with fallbacks for manual API token entry like Bluesky/Telegram).
- **Media Library:** A robust file management system with infinite folder nesting, backed by Backblaze B2 storage.
- **Content Calendar:** A dynamic Day/Week/Month calendar for visualizing scheduled content.
- **AI Studio (Pending):** Integration with Google Gemini for auto-captioning and content generation.

---

## 2. Tech Stack & Architecture
### Frontend (Vite + React + TypeScript)
* **Framework:** React 19 / Vite
* **Routing:** `react-router-dom` (Protected routes wrapped in `/app/*`)
* **State Management:** `zustand` (Global UI state) + `@tanstack/react-query` (Persistent server-state caching).
* **Styling:** Tailwind CSS + `shadcn/ui` components.
* **Authentication:** Clerk (`@clerk/react`).

### Backend (Node.js + Express + TypeScript)
* **Framework:** Express.js
* **Database ORM:** Prisma (`@prisma/client`) connecting to Supabase PostgreSQL.
* **Background Jobs:** BullMQ + Redis (Upstash) for scheduling and publishing posts.
* **Storage SDK:** `@aws-sdk/client-s3` (Connecting to Backblaze B2 via S3 compatibility layer).

### Infrastructure
* **Frontend Hosting:** Vercel (`https://socialflow-saas.vercel.app`)
* **Backend Hosting:** Render (`https://socialflow-saas.onrender.com`)
* **Database:** Supabase (PostgreSQL with pgBouncer)
* **Message Queue:** Upstash Redis
* **Blob Storage:** Backblaze B2

---

## 3. Database Schema (Prisma)
The database is strictly relational and enforces Cascade deletion.
* **`User` & `Workspace`**: The core of the multi-tenant system. A User belongs to a Workspace via `WorkspaceMember`.
* **`SocialAccount`**: Stores encrypted OAuth tokens (`accessToken`, `refreshToken`) for connected channels.
* **`MediaAsset` & `MediaFolder`**: Handles the organization of uploaded files. `fileUrl` stores the raw S3 Key.
* **`Post` & `SocialAccountPost`**: A junction table architecture allowing a single `Post` to be scheduled across multiple `SocialAccount`s.

---

## 4. Environment Variables (.env)
The system relies on 48 environment variables. **Never commit these to GitHub.**

### Required Backend Variables (`backend/.env`)
```env
# Database
DATABASE_URL="postgresql://...supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://...supabase.com:5432/postgres"

# Authentication & Encryption
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."
ENCRYPTION_KEY="32_byte_secret_key" # Used in crypto.ts to encrypt OAuth tokens in DB

# Background Workers
REDIS_URL="rediss://...upstash.io:6379"

# Backblaze B2 Storage
S3_ENDPOINT="s3.us-east-005.backblazeb2.com"
S3_REGION="us-east-005"
S3_BUCKET_NAME="Socialflow"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PUBLIC_URL="https://f005.backblazeb2.com/file/Socialflow"

# Core Routing (CRITICAL)
NODE_ENV="production"
BACKEND_URL="https://socialflow-saas.onrender.com"
FRONTEND_URL="https://socialflow-saas.vercel.app"

# OAuth Providers (Examples)
X_CLIENT_ID="..."
X_CLIENT_SECRET="..."
WORDPRESS_CLIENT_ID="..."
WORDPRESS_CLIENT_SECRET="..."
```

---

## 5. Critical Workflows & Implementations

### A. The OAuth Flow (`backend/routes/oauth.ts`)
1. **Initiation:** User clicks Connect on Frontend -> Frontend opens new tab to Backend `/api/oauth/:platform/connect`.
2. **URL Generation:** Backend constructs authorization URL based on platform requirements (e.g., adding `user_scope` for Slack, or `access_type=offline` for Google).
3. **Redirection:** User authorizes on external platform -> Redirects to Backend `/api/oauth/:platform/callback`.
4. **Token Exchange:** Backend trades code for `access_token` and `refresh_token`. (Handles quirks like Tumblr requiring Basic Auth headers, or Slack returning tokens inside `authed_user`).
5. **Profile Extraction:** Backend normalizes the user profile (extracting specific IDs like `sub` for YouTube).
6. **Storage:** Tokens are encrypted using `crypto.ts` and saved to `SocialAccount`.

### B. The Media Storage Flow (`backend/routes/media.ts`)
We use a **Private Bucket** architecture to avoid credit card requirements on Backblaze.
1. **Upload:** Frontend requests a Presigned PUT URL. S3 Key is formatted as `${workspaceId}/${timestamp}-${filename}` to enforce multi-tenancy.
2. **Database:** Frontend completes upload and registers the asset in the database.
3. **Retrieval:** To display private images, `GET /api/media` dynamically requests a **B2 Download Authorization Token** covering the entire `${workspaceId}/` prefix. This allows the frontend to load hundreds of images instantly using a single appended `?Authorization=token` query string.

---

## 6. Known Challenges & Recent Fixes (Context for Next Coder)

*   **The "Localhost Redirect" Ghost:** During development, the frontend/backend sometimes fell back to `localhost:3001` if `BACKEND_URL` wasn't correctly pulled from `process.env`. This caused OAuth providers (Tumblr, Twitter) to reject the callback. **Fix:** Production URLs are now hardcoded in `src/lib/api.ts` and `oauth.ts`.
*   **Redis Crash Loop:** Render deployments were failing due to `ECONNREFUSED 127.0.0.1:6379`. BullMQ was trying to connect to a local Redis instance that didn't exist. **Fix:** We provisioned an Upstash Redis database and injected `REDIS_URL`. Do not remove this variable, or the worker threads will crash the app.
*   **Media CORS Issues:** Browsers block direct S3 PUT requests without proper CORS. **Fix:** We explicitly applied `s3_put` operations to the Backblaze B2 CORS rules.
*   **Slack Bot Deprecation:** Slack blocks legacy bot permissions. **Fix:** We updated the `oauth.ts` to request `user_scope=chat:write` instead of standard bot scopes.

---

## 7. Developer Portal Configuration Guide
For any OAuth connection to work, the respective Developer Portals MUST be configured with these exact Callback URIs:

*   **Twitter (X):** Must be set to "Web App, Automated App or Bot" (PKCE enabled).
    *   Callback: `https://socialflow-saas.onrender.com/api/oauth/x/callback`
*   **Discord:**
    *   Callback: `https://socialflow-saas.onrender.com/api/oauth/discord/callback`
*   **YouTube/GMB (Google Cloud Console):**
    *   Callback: `https://socialflow-saas.onrender.com/api/oauth/youtube/callback`
*   **WordPress:**
    *   Callback: `https://socialflow-saas.onrender.com/api/oauth/wordpress/callback`
*   **LinkedIn:**
    *   Callback: `https://socialflow-saas.onrender.com/api/oauth/linkedin/callback`

---

## 8. Next Steps & Immediate Roadmap
If taking over this project, the next priorities are:

1.  **BullMQ Implementation:** The Redis queue is connected, but the actual worker logic (`backend/workers/publisher.ts`) needs to be fully wired up to execute the API calls to the social networks using the decrypted `access_tokens`.
2.  **Live Analytics Sync:** Currently, Channel cards display `0` for followers/reach. A cron job or manual sync route needs to be created to fetch live metrics using the stored OAuth tokens.
3.  **AI Studio:** Connect the `GOOGLE_AI_API_KEY` to the `AIStudio.tsx` frontend to generate post captions and imagery automatically.