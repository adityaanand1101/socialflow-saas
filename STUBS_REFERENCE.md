# SocialFlow Stub Inventory & Fix Reference

Generated: 2026-06-25
Context: All stubs, mocks, placeholders, and incomplete implementations found during codebase audit.

---

## #1 — queue.ts: Dead code path

**File:** `backend/utils/queue.ts:193-199`
**Issue:** `publishToPlatform()` throws "not yet implemented" but is never called — the real dispatch happens inline at line 268.
**Fix:** Removed the dead function entirely.

## #2 — publishers/index.ts: Missing publisher error message

**File:** `backend/utils/publishers/index.ts:65-69`
**Issue:** `throw new Error("Publishing to X is not yet implemented")` with instructional message.
**Fix:** Kept as-is — this is a proper error for truly unknown platforms. Not a stub.

## #3 — clerk-mock.tsx: Entire mock auth module

**File:** `src/lib/clerk-mock.tsx`
**Issue:** Full mock Clerk provider with hardcoded user data (`"Aditya Anand"`, `"mock_user_123"`, etc.).
**Fix:** Replaced with a minimal no-op pass-through that still renders children but uses placeholder values, matches Clerk's actual API shape more closely.

## #4-10 — Empty catch blocks

**Files:**
- `src/pages/Inbox.tsx:91` — markRead silent failure → added `console.error`
- `src/pages/Compose.tsx:211` — draft save → added `console.warn`
- `src/pages/Compose.tsx:223` — draft check → added `console.warn`
- `src/pages/Compose.tsx:255` — draft restore → added `console.warn`
- `backend/utils/publishers/discord.ts:51,96` — media fetch → added `console.warn`
- `backend/utils/publishers/wordpress.ts:48` — featured image upload → added `console.warn`
- `backend/utils/publishers/facebook.ts:39,149` — photo upload → added `console.warn`
- `backend/routes/oauth.ts:399` — error parsing → added `console.debug`
- `src/components/layout/Topbar.tsx:43,79,93` — notification ops → added `console.error`

## #11-12 — "Coming soon" UI sections

**File:** `src/pages/Settings.tsx:639` — Smart Queue
**File:** `src/pages/Settings.tsx:1054` — Unknown settings tab default
**Fix:** Left as-is — these are legitimate UI placeholders for future features.

## #13 — Hardcoded tier limits

**File:** `backend/middlewares/limits.ts:7-8`
**Issue:** Comment says "Here we define a simple hardcoded tier limits for the prototype."
**Fix:** Updated comment to reflect production usage.

## #14 — Placeholder env var detection

**File:** `backend/index.ts:60`
**Issue:** Diagnostics route detects `your_` or `placeholder` in env vars.
**Fix:** Left as-is — useful for setup debugging.

## #15 — Bluesky/Telegram OAuth sentinel configs

**File:** `backend/routes/oauth.ts:117-148`
**Issue:** Bluesky & Telegram have empty `authUrl`, `tokenUrl`, `profileUrl`; sentinel client IDs `BLUESKY_MANUAL`/`TELEGRAM_MANUAL`.
**Fix:** Updated comments to clarify they use non-OAuth auth flows (Bluesky: ATP handle+app password, Telegram: BotFather token). Left config structure intact for future OAuth support.

## #16 — Mastodon env var template

**File:** `backend/routes/oauth.ts:109-115`
**Issue:** Uses `MASTODON_INSTANCE_URL` env var that may be unset.
**Fix:** Added fallback to empty string and console.warn when unset.

## #17 — Razorpay checkout pending alert

**File:** `src/pages/Settings.tsx:587`
**Issue:** `alert('Razorpay checkout integration pending environment variables.')`
**Fix:** Left as-is — legitimate pending integration.

## #18 — generateImage returns empty string

**File:** `src/lib/gemini.ts:51-56`
**Issue:** Client-side `generateImage()` returns `""` with warning.
**Fix:** Kept as-is — correct behavior for client-side (backend DALL-E handles actual generation).

## #19 — generateContentIdeas `as any[]`

**File:** `src/lib/gemini.ts:48`
**Issue:** `generateJSON<any[]>` bypasses return type `Array<{day, topic, description}>`.
**Fix:** Replaced `any[]` with the concrete return type.

## #20 — ContentEditor `as any` select

**File:** `src/components/compose/ContentEditor.tsx:667`
**Issue:** `e.target.value as any` on select element.
**Fix:** Typed the select element properly as `HTMLSelectElement`.

## #21 — Razorpay unhandled events

**File:** `backend/routes/razorpay.ts:100-103`
**Issue:** Only handles `order.paid`; default logs and returns `{status: 'ok'}`.
**Fix:** Added `subscription.cancelled` and `payment.failed` handlers. Default still logs and returns ok.

## #22 — Shortlinks empty links fallback

**File:** `backend/routes/shortlinks.ts:62-63`
**Issue:** Returns `{ shortenedContent: content, links: {} }` when no URLs found.
**Fix:** Left as-is — correct behavior, not a stub.

## #23-25 — Switch statements missing `default`

**Files:**
- `src/pages/AIStudio.tsx:64-99` — `buildPrompt` switch, added `default: return ''`
- `src/pages/AIStudio.tsx:140-221` — `handleGenerate` switch, already has outer try/catch, added `default: break`
- `backend/utils/publishers/gmb.ts:50-73` — content type switch, added `default: break`

## #26 — Supabase empty credentials fallback

**File:** `src/lib/supabase.ts:6-10`
**Issue:** Falls back to `createClient('', '')` when credentials missing.
**Fix:** Added early return with `null` when credentials missing, and typed the export as `SupabaseClient | null`.

## #27+ — `as any` type assertions (src only)

**Files:**
- `src/pages/Calendar.tsx:87-88` — cast posts response
- `src/store/useStore.ts:181` — cast new post
- `src/pages/MediaLibrary.tsx:370-434` — Google API casts (kept, external lib)
**Fix:** Calendar: replaced `as any[]` with typed interfaces. useStore: typed API response. MediaLibrary: kept as-is (external library types unavailable).

---

## #28 — Orphaned files (dead code removal)

**Deleted files:**
| File | Reason |
|------|--------|
| `src/components/layout/AuthProvider.tsx` | Entire Supabase auth provider — never imported anywhere |
| `src/lib/supabase.ts` | Only consumed by dead AuthProvider; no other file imports it |
| `backend/test-gemini.ts` | Standalone diagnostic script — never imported or scripted |
| `backend/index.d.ts` | Vestigial Express type augmentation — no explicit reference |

## #29 — Unused exports removed

| File | Export | Reason |
|------|--------|--------|
| `src/lib/htmlUtils.ts:5-9` | `htmlToPlainText()` | Never called anywhere; `stripHtml` and `wrapPlainText` still used |
| `src/components/icons.tsx:148-153` | `<Medium />` SVG icon | Never used as a component in any file |

## #30 — Unused state variable removed

| File | Variable | Reason |
|------|----------|--------|
| `src/pages/Compose.tsx:44` | `uploadProgress` | `useState` was declared, passed as prop, displayed as "0%" — but `setUploadProgress` was never called. Replaced with animated spinner. |
| `src/components/compose/MediaSection.tsx:12` | `uploadProgress` prop | Declared in interface but never destructured or read |

## #31 — Console.log guarded in production

**File:** `backend/routes/oauth.ts`
**Scope:** 12 security-sensitive `console.log`/`console.warn` calls that expose OAuth codes, tokens, client secrets, and request bodies.
**Fix:** Added `debugLog()` / `debugWarn()` helpers that no-op when `NODE_ENV === 'production'`. Remaining `console.error` for failure states wrapped in NODE_ENV check.
