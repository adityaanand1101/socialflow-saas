# AI Agent Development Prompt 1: Database Setup, Authentication, & User Management

## Goal
Implement a secure, multi-tenant authentication system, database schema, and user profile management backend for the SocialFlow SaaS application, integrating it with the existing React frontend prototype.

---

## 1. System Context & Existing Routes
The current React prototype includes user interfaces that must transition from static/mock data to real backend data:
- **Dashboard (`/`)**: Displays user details and active account indicators.
- **Settings (`/settings`)**: Includes a "Profile" tab for editing personal details (name, email, profile picture) and security settings.
- **Sidebar Header**: Displays the logged-in user's name, email, and avatar.

---

## 2. Technical Requirements

### Backend Framework & Database
- **Framework**: Node.js with Express (TypeScript) or Next.js Route Handlers.
- **ORM**: Prisma ORM.
- **Database**: PostgreSQL (hosted on Supabase, Neon, or local).

### Authentication Solution
- **Provider**: **Clerk Auth** (or **Supabase Auth**). Clerk is preferred for quick multi-tenant setup.
- **Session Management**: JWT token validation on the backend API.
- **State Syncing**: Webhook listener (`/api/webhooks/clerk`) to sync user registration, updates, and deletions from Clerk to the local PostgreSQL database.

---

## 3. Database Schema (Prisma)
Create the initial PostgreSQL schema using Prisma. Ensure appropriate indexes and constraints.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id               String            @id @default(uuid())
  clerkId          String            @unique
  email            String            @unique
  name             String?
  avatarUrl        String?
  stripeCustomerId String?           @unique
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  // Relations
  memberships      WorkspaceMember[]
  posts            Post[]
  mediaAssets      MediaAsset[]
  aiLogs           AiGenerationLog[]
}

model Workspace {
  id                   String            @id @default(uuid())
  name                 String
  slug                 String            @unique
  logoUrl              String?
  stripeSubscriptionId String?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  // Relations
  members              WorkspaceMember[]
  socialAccounts       SocialAccount[]
  posts                Post[]
  mediaAssets          MediaAsset[]
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String
  userId      String
  role        Role     @default(MEMBER)
  createdAt   DateTime @default(now())

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

---

## 4. API Endpoints to Implement

### Authentication & Webhooks
- `POST /api/webhooks/clerk`: Handles `user.created`, `user.updated`, and `user.deleted` events. Verifies webhook signatures using `svix`.

### User Profile Management
- `GET /api/user/me`: Retrieves current authenticated user profile, active workspace, and memberships.
- `PATCH /api/user/me`: Updates profile details (name, avatarUrl) in the DB and reflects back to Clerk via SDK if modified.

---

## 5. Step-by-Step Implementation Instructions

### Step 1: Initialize Database & Prisma
1. Install `@prisma/client` and `prisma` dev dependency.
2. Initialize Prisma with `npx prisma init`.
3. Set up the schema provided in Section 3 in `schema.prisma`.
4. Run `npx prisma db push` or create a migration with `npx prisma migrate dev --name init_auth_schema`.

### Step 2: Set Up Clerk Auth on the Frontend
1. Install Clerk SDK (`@clerk/clerk-react` or `@clerk/nextjs`).
2. Wrap the root component of the React application with `<ClerkProvider>`.
3. Protect routes: redirect unauthorized users to the sign-in screen.
4. Replace static sidebar user profile with `<UserButton />` or data from `useUser()`.

### Step 3: Implement Backend JWT Verification Middleware
1. Create a middleware `requireAuth` that:
   - Extracts the Bearer token from the `Authorization` header.
   - Verifies the JWT using Clerk's JSON Web Key Set (JWKS).
   - Attaches the verified `clerkId` and custom `userId` to the request object.

### Step 4: Sync Clerk Users via Webhooks
1. Implement `POST /api/webhooks/clerk` endpoint.
2. Verify the payload using Clerk signature headers (`svix-id`, `svix-timestamp`, `svix-signature`).
3. Create or update the corresponding `User` record in PostgreSQL.
4. Automatically create a default personal `Workspace` for the user upon signup.

---

## 6. Verification & Definition of Done
- [ ] User can sign up/log in using Clerk OAuth (Google/Email).
- [ ] Sign-up triggers a Clerk webhook that successfully inserts the user record and a default workspace into the PostgreSQL database.
- [ ] Unauthenticated API requests return `401 Unauthorized`.
- [ ] Profile edits on the `/settings` screen send a request to `PATCH /api/user/me`, updating the profile name and image successfully in the DB and UI.
- [ ] Write integration test for JWT verification middleware and webhook payload verification.
