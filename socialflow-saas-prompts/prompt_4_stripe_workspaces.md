# AI Agent Development Prompt 4: Multi-Tenant Workspaces, Stripe Billing, & Deployments

## Goal
Implement a multi-tenant workspace architecture with team invitation permissions, Stripe subscription/billing controls, and prepare the production environments for final Vercel/Render deployments.

---

## 1. System Context & Existing Routes
- **Team Page (`/team`)**: Displays workspace members with a grid/list, a roles matrix, and an "Invite Member" modal.
- **Settings Page (`/settings`)**:
  - "Workspace" tab (Rename workspace, branding).
  - "Billing" tab (Shows current plan, invoices, and a button to launch the Stripe Customer Portal).
- **Pricing Landing Page (Optional or `/pricing`)**: Displays cards for Starter, Pro, and Enterprise tiers.

---

## 2. Database Schema Extensions
In `schema.prisma`, add support for team invitations:

```prisma
model WorkspaceInvite {
  id          String         @id @default(uuid())
  workspaceId String
  email       String
  role        Role           @default(MEMBER)
  token       String         @unique
  expiresAt   DateTime
  status      InviteStatus   @default(PENDING)
  createdAt   DateTime       @default(now())

  workspace   Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}

enum InviteStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
```

---

## 3. Stripe Subscriptions Configuration

### Pricing Tier Strategy
1. **Starter Plan ($19/mo)**: 1 Workspace, 3 Social Channels, 1 User Seat, 10 Scheduled Posts/mo.
2. **Pro Plan ($49/mo)**: 3 Workspaces, 10 Social Channels, 5 User Seats, Unlimited Scheduled Posts.
3. **Enterprise Plan ($149/mo)**: Unlimited Workspaces, Unlimited Social Channels, Unlimited Seats.

### Stripe Webhook Handlers (`POST /api/webhooks/stripe`)
Create a route that handles events from Stripe. Use the standard Stripe package to verify request signatures (`stripe-signature`).

- `checkout.session.completed`: Locates the associated `Workspace` via metadata (e.g., `workspaceId` passed in custom session params) and updates the subscription plan details.
- `customer.subscription.updated`: Syncs active state, status changes (e.g. `trialing`, `active`, `past_due`, `canceled`), and plans to the workspace model.
- `customer.subscription.deleted`: Drops the workspace back to the free/restricted tier.

### SaaS Middleware Enforcement
Create a middleware `checkSaaSLimits(limitType)` to intercept requests and block them if quotas are exceeded:
- `verifyWorkspaceQuota`: Before creating a new workspace, verify user's current subscription level allows it.
- `verifyChannelQuota`: Before initiating an OAuth connection, verify current active channels < plan limit.
- `verifySeatQuota`: Before sending an invitation, check current workspace member count + pending invites < seat limit.

---

## 4. Team Collaboration API Endpoints

### Workspace Management
- `POST /api/workspaces`: Creates a new workspace and sets the calling user as the `OWNER`.
- `PATCH /api/workspaces/:id`: Edit details (e.g., rename, logo image). Must be `OWNER` or `ADMIN`.

### Invitations Flow
- `POST /api/workspaces/:id/invites`: Sends email invitation.
  - Validates seat quota.
  - Generates unique secure `token` and sets `expiresAt` (24 hours).
  - Sends email with Link: `https://socialflow-saas.vercel.app/accept-invite?token=XYZ`.
- `GET /api/invites/resolve?token=XYZ`: Verifies token validity.
- `POST /api/invites/accept`: Links user to workspace as `MEMBER`/`ADMIN` and flags invite as `ACCEPTED`.

---

## 5. Deployment Setup & Configurations

### Backend Hosting (Render/Railway/AWS)
- Configure `Dockerfile` or start scripts in `package.json`:
  ```json
  "scripts": {
    "build": "tsc && prisma generate",
    "start": "node dist/server.js",
    "prisma:migrate": "prisma migrate deploy"
  }
  ```

### Frontend Deployment (Vercel)
- Put `vercel.json` in root workspace containing rewrite configs to route all client routing to `index.html`:
  ```json
  {
    "rewrites": [
      { "source": "/api/(.*)", "destination": "https://api.socialflow.com/api/$1" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

---

## 6. Verification & Definition of Done
- [ ] Changing subscription plan on Stripe sandbox updates the corresponding Workspace DB model values seamlessly.
- [ ] Users with "Starter" plan receive warnings / errors when trying to connect a 4th social account or inviting a 2nd member.
- [ ] Sending a team invite sends an invite email (via SendGrid/Resend) with a clickable accept link.
- [ ] Acceptance link redirects back to application, adds the new user to the workspace memberships with the correct Role, and redirects them to the workspace dashboard.
- [ ] Write integration test verifying access control middleware returns `403 Forbidden` if user role is `VIEWER` attempting a `POST /compose` action.
