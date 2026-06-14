# 🚀 Socialflow SaaS: Final Production Checklist

This checklist contains all the remaining tasks required to transition from a technical prototype to a live, commercial SaaS.

## 1. Authentication (Clerk)
- [ ] **Switch to Production Instance:** Create a production instance in your Clerk Dashboard.
- [ ] **Domain Verification:** Add your production domain (`socialflow-saas.vercel.app` or custom domain) to Clerk.
- [ ] **Update Keys:** Replace `pk_test_...` and `sk_test_...` with `pk_live_...` and `sk_live_...` in both Vercel and Render environment variables.
- [ ] **Sync Webhooks:** Update the Clerk Webhook URL to point to your Render production URL: `https://socialflow-saas.onrender.com/api/webhooks/clerk`.

## 2. Billing & Payments (Razorpay)
- [ ] **Switch to Live Mode:** Activate "Live Mode" in your Razorpay Dashboard.
- [ ] **Update API Keys:** Replace Test Key ID/Secret with Live Key ID/Secret on Render.
- [ ] **Configure Live Webhook:** Ensure the Razorpay webhook for `payment.captured` points to your production backend.
- [ ] **KYC Completion:** Ensure your Razorpay account has completed all KYC requirements to accept real payments.

## 3. Social Media App Reviews (The "Hard" Part)
- [ ] **Meta (Facebook/Instagram):**
    - Submit your app for **App Review**.
    - Request `pages_manage_posts`, `instagram_content_publish`, and `pages_read_engagement` permissions.
    - Ensure your Privacy Policy and Terms of Service URLs are correctly linked in the Meta App settings.
- [ ] **LinkedIn:**
    - Switch your app from "Development" to "Marketing Developer Platform" (or similar tier) to allow posting for real users.
- [ ] **X (Twitter):**
    - Ensure your app is set to "Production" and the Redirect URI matches your Render callback exactly.

## 4. File Hosting (Backblaze B2)
- [ ] **CORS Configuration:** Log into Backblaze B2 and ensure your bucket has a CORS policy that allows `GET` and `POST` from `https://socialflow-saas.vercel.app`.
- [ ] **Public URL Verification:** Verify that images uploaded to your bucket are publicly reachable via the `S3_PUBLIC_URL` defined in your environment.

## 5. Branding & Professionalism
- [ ] **Custom Domain:** (Optional but recommended) Link a professional domain (e.g., `getsocialflow.com`) to Vercel and Render.
- [ ] **Mail Server:** Configure a professional email provider (Postmark, Resend, or SendGrid) for Clerk's transactional emails (welcome, password reset).
- [ ] **Legal Links:** Add links to the `/privacy` and `/terms` pages in your App's footer/signup page.

## 6. Final Verification (End-to-End)
- [ ] **Auth Flow:** Sign up as a new user and verify that a User and Workspace are created in the Supabase database.
- [ ] **Media Flow:** Upload an image and verify it shows up in the "Media Library" correctly.
- [ ] **Scheduling Flow:** Create a post, schedule it for 15 minutes from now, and verify that the BullMQ worker publishes it automatically.

---
**Status:** Architecture is stable. All technical hurdles (Express 5, IPv4 Pooler, CORS) have been resolved.
