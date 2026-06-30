import { Router } from 'express';
import { PrismaClient, PlatformType } from '@prisma/client';
import { encryptToken } from '../utils/crypto';
import { requireAuth } from '../middlewares/auth';
import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Parser from 'rss-parser';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// In-memory store for PKCE code_verifiers (keyed by Clerk userId / state param)
const pkceStore = new Map<string, string>();

// In-memory cache to detect duplicate OAuth code processing (e.g., browser prefetch + real redirect)
const processedCodes = new Map<string, number>();
const CODE_DEDUP_TTL_MS = 60000; // 1 minute

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
if (!ENCRYPTION_KEY) {
  console.error('CRITICAL: ENCRYPTION_KEY not set — OAuth token encryption will fail');
}
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://socialflow-saas.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://socialflow-saas.onrender.com';

if (!process.env.MASTODON_INSTANCE_URL) {
  console.warn('MASTODON_INSTANCE_URL not set — Mastodon OAuth will fail');
}

const debugLog = (platform: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${platform}]`, ...args);
  }
};

const debugWarn = (platform: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[${platform}]`, ...args);
  }
};

// Helper to determine redirect URL
const getRedirectUri = (platform: string) => `${BACKEND_URL}/api/oauth/${platform}/callback`;

const providers = {
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/userinfo',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    scopes: 'w_member_social openid profile email',
  },
  x: {
    authUrl: 'https://x.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    profileUrl: 'https://api.x.com/2/users/me',
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    scopes: 'tweet.read tweet.write users.read offline.access',
  },
  instagram: {
    // Instagram API with Instagram Login (Business Login for Instagram)
    // Uses Instagram-hosted OAuth, does NOT require a linked Facebook Page
    // Only works for Business/Creator accounts (personal accounts rejected at OAuth layer)
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    // Get Instagram user profile + account type
    profileUrl: 'https://graph.instagram.com/me?fields=id,username,account_type,profile_picture_url',
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    scopes: 'instagram_business_basic,instagram_business_content_publish',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v22.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,picture',
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    scopes: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
  },
  threads: {
    authUrl: 'https://threads.net/oauth/authorize',
    tokenUrl: 'https://graph.threads.net/oauth/access_token',
    profileUrl: 'https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url',
    clientId: process.env.THREADS_CLIENT_ID || '',
    clientSecret: process.env.THREADS_CLIENT_SECRET || '',
    scopes: 'threads_basic,threads_content_publish',
  },
  gmb: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    clientId: process.env.GMB_CLIENT_ID || '',
    clientSecret: process.env.GMB_CLIENT_SECRET || '',
    scopes: 'https://www.googleapis.com/auth/business.manage',
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly profile email',
  },
  pinterest: {
    authUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    profileUrl: 'https://api.pinterest.com/v5/user_account',
    clientId: process.env.PINTEREST_CLIENT_ID || '',
    clientSecret: process.env.PINTEREST_CLIENT_SECRET || '',
    scopes: 'boards:read,pins:read,pins:write',
  },
  reddit: {
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    profileUrl: 'https://oauth.reddit.com/api/v1/me',
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    scopes: 'identity,submit,edit',
  },
  mastodon: {
    authUrl: `${process.env.MASTODON_INSTANCE_URL || ''}/oauth/authorize`, 
    tokenUrl: `${process.env.MASTODON_INSTANCE_URL || ''}/oauth/token`,
    profileUrl: `${process.env.MASTODON_INSTANCE_URL || ''}/api/v1/accounts/verify_credentials`,
    clientId: process.env.MASTODON_CLIENT_ID || '',
    clientSecret: process.env.MASTODON_CLIENT_SECRET || '',
    scopes: 'read write', // Mastodon scopes are space-separated, 'read write' is standard
  },
  bluesky: {
    authUrl: '', // Uses ATP/lexicon directly with handle + app password
    tokenUrl: '',
    profileUrl: '',
    clientId: 'BLUESKY_MANUAL', 
    clientSecret: '',
    scopes: '',
  },
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    profileUrl: 'https://slack.com/api/users.identity',
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    scopes: 'chat:write,users.profile:read', // Note: Sent as user_scope below
  },
  discord: {
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    profileUrl: 'https://discord.com/api/users/@me',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    scopes: 'identify guilds.join gdm.join',
  },
  telegram: {
    authUrl: '', // Uses BotFather / Widget flow
    tokenUrl: '',
    profileUrl: '',
    clientId: 'TELEGRAM_MANUAL',
    clientSecret: '',
    scopes: '',
  },
  tumblr: {
    authUrl: 'https://www.tumblr.com/oauth2/authorize',
    tokenUrl: 'https://api.tumblr.com/v2/oauth2/token',
    profileUrl: 'https://api.tumblr.com/v2/user/info',
    clientId: process.env.TUMBLR_CLIENT_ID || '',
    clientSecret: process.env.TUMBLR_CLIENT_SECRET || '',
    scopes: 'basic write', // Ensure these match Tumblr portal exactly
  },
  wordpress: {
    authUrl: 'https://public-api.wordpress.com/oauth2/authorize',
    tokenUrl: 'https://public-api.wordpress.com/oauth2/token',
    profileUrl: 'https://public-api.wordpress.com/rest/v1.1/me',
    clientId: process.env.WORDPRESS_CLIENT_ID || '',
    clientSecret: process.env.WORDPRESS_CLIENT_SECRET || '',
    scopes: 'global',
  }
};

// Diagnostic route to verify what URLs the server thinks it should use
router.get('/test-redirects', (req: any, res: any) => {
  res.json({
    FRONTEND_URL,
    BACKEND_URL,
    env: {
      FRONTEND: process.env.FRONTEND_URL,
      BACKEND: process.env.BACKEND_URL
    },
    redirects: {
      tumblr: getRedirectUri('tumblr'),
      x: getRedirectUri('x'),
      youtube: getRedirectUri('youtube')
    }
  });
});

router.get('/:platform/connect', requireAuth, async (req: any, res: any) => {
  try {
    const { platform } = req.params;
    const validPlatforms = Object.keys(providers);
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }
    const provider = providers[platform as keyof typeof providers];
    
    if (!provider || !provider.clientId) {
      console.error(`[${platform}] OAuth not configured - missing clientId`);
      return res.status(400).json({ error: `OAuth for ${platform} is not configured on the server.` });
    }

    const redirectUri = getRedirectUri(platform);
    const clerkUserId = req.auth.userId;
    const state = clerkUserId;
    if (platform === 'threads' || platform === 'facebook' || platform === 'instagram') {
      res.cookie('pending_oauth_user', clerkUserId, {
        maxAge: 120000,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });
    }

    console.log(`[${platform}] OAuth connect - redirectUri: ${redirectUri}, clientId: ${provider.clientId?.substring(0, 10)}...`);
    
    // Validate redirect URI format
    try {
      new URL(redirectUri);
    } catch {
      console.error(`[${platform}] Invalid redirect URI: ${redirectUri}`);
      return res.status(500).json({ error: `Invalid redirect URI configuration for ${platform}` });
    }

    const authUrl = new URL(provider.authUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', provider.clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    
    if (platform === 'slack') {
      authUrl.searchParams.append('user_scope', provider.scopes);
    } else {
      authUrl.searchParams.append('scope', provider.scopes);
    }

    if (platform === 'youtube' || platform === 'gmb') {
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
    }

    if (platform === 'x') {
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      pkceStore.set(state, codeVerifier);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
    }

    res.json({ authUrl: authUrl.toString() });
  } catch (err: any) {
    console.error('Connect Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:platform/callback', async (req: any, res) => {
  const { platform } = req.params;
  const { code, state: clerkId, error, error_description, error_reason } = req.query;

  // Handle OAuth errors from the provider
  if (error) {
    console.error(`[${platform}] OAuth error: ${error} - ${error_description} - ${error_reason}`);
    return res.status(400).send(`
      <html><body>
      <h2>OAuth Authorization Failed</h2>
      <p><strong>Error:</strong> ${error}</p>
      <p><strong>Description:</strong> ${error_description || 'Unknown'}</p>
      <p><strong>Reason:</strong> ${error_reason || 'Unknown'}</p>
      <a href="${FRONTEND_URL}/app/channels">Return to App</a>
      </body></html>
    `);
  }

  // Threads API has been observed to drop the state parameter — recover clerkId from cookie
  let resolvedClerkId = (clerkId as string) || req.cookies?.pending_oauth_user;

  if (!code || !resolvedClerkId) {
    console.error(`[${platform}] Missing code or state parameter`);
    console.error(`[${platform}] code present: ${!!code}, state/clerkId from query: ${!!clerkId}, cookie: ${!!req.cookies?.pending_oauth_user}`);
    console.error(`[${platform}] query params: ${JSON.stringify(req.query)}`);
    console.error(`[${platform}] cookies: ${JSON.stringify(req.cookies)}`);
    return res.status(400).send(`
      <html><body>
      <h2>OAuth Callback Failed</h2>
      <p><strong>Error:</strong> Missing code or state parameter</p>
      <p><strong>Code present:</strong> ${!!code}</p>
      <p><strong>State/ClerkId from query:</strong> ${!!clerkId}</p>
      <p><strong>Cookie present:</strong> ${!!req.cookies?.pending_oauth_user}</p>
      <p><strong>Query params:</strong> ${JSON.stringify(req.query)}</p>
      <p><strong>Cookies:</strong> ${JSON.stringify(req.cookies)}</p>
      <a href="${FRONTEND_URL}/app/channels">Return to App</a>
      </body></html>
    `);
  }

  const provider = providers[platform as keyof typeof providers];
  if (!provider || !provider.clientId || !provider.clientSecret) {
    console.error(`[${platform}] Provider not configured`);
    return res.status(400).send('Unsupported or unconfigured platform');
  }

  debugLog(platform, `OAuth callback - code received, exchanging for token...`);
  debugLog(platform, `Callback details - raw query: ${JSON.stringify(req.query)}, code (first 10): ${(code as string).substring(0,10)}..., code length: ${(code as string).length}, platform: ${platform}, cookie present: ${!!req.cookies?.pending_oauth_user}, clerkId from state: ${!!clerkId}`);
  debugLog(platform, `Full request URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  // Check for special characters in the code
  const codeStr = code as string;
  if (/[+\s&=%]/.test(codeStr)) {
    debugWarn(platform, `WARNING: Code contains special characters (+, &, =, %, or spaces) that may be corrupted by query parsing`);
  }

  // Dedup: prevent processing the same authorization code twice
  const codeKey = `${platform}:${code}`;
  const now = Date.now();
  if (processedCodes.has(codeKey)) {
    const firstSeen = processedCodes.get(codeKey)!;
    debugWarn(platform, `DUPLICATE CALLBACK DETECTED - code ${(code as string).substring(0,10)}... was first seen ${now - firstSeen}ms ago. Skipping.`);
    debugWarn(platform, `This means the callback URL was requested TWICE. Possible browser prefetch or redirect loop.`);
    return res.redirect(`${FRONTEND_URL}/app/channels?duplicate=true`);
  }
  processedCodes.set(codeKey, now);
  // Clean up old entries every 10 codes
  if (processedCodes.size > 10) {
    for (const [key, ts] of processedCodes) {
      if (now - ts > CODE_DEDUP_TTL_MS) processedCodes.delete(key);
    }
  }

  try {
    let accessToken = '';
    let refreshToken = null;
    let tokenExpiresIn = 3600;
    
    let profile: { id: string; username: string; displayName: string; avatarUrl: string | null } = {
      id: '',
      username: '',
      displayName: '',
      avatarUrl: null
    };

    // Execute the real OAuth code exchange flow
    let redirectUri = getRedirectUri(platform);
    // Meta Dashboard may add trailing slash to redirect URIs — detect from request URL
    if ((platform === 'threads' || platform === 'instagram') && req.originalUrl?.startsWith(getRedirectUri(platform) + '/')) {
      redirectUri = getRedirectUri(platform) + '/';
      debugLog(platform, `Request URL has trailing slash, adjusting redirect_uri to match Dashboard`);
    }
    debugLog(platform, `Token exchange - redirectUri: ${redirectUri}`);
    
    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('code', code as string);
    bodyParams.append('redirect_uri', redirectUri);

    // X (confidential client) uses Basic Auth header instead of body params
    if (platform !== 'x') {
      bodyParams.append('client_id', provider.clientId);
      bodyParams.append('client_secret', provider.clientSecret);
    }

    if (platform === 'x') {
      const codeVerifier = pkceStore.get(resolvedClerkId);
      if (codeVerifier) {
        bodyParams.append('code_verifier', codeVerifier);
        pkceStore.delete(resolvedClerkId);
      }
    }

    const usesBasicAuth = platform === 'tumblr' || platform === 'slack' || platform === 'x';

    const requestBody = bodyParams.toString();
    debugLog(platform, `Exchanging code at ${provider.tokenUrl}`);
    debugLog(platform, `Request body (redacted): grant_type=authorization_code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${provider.clientId.substring(0,8)}...&client_secret=${provider.clientSecret.substring(0,4)}...&code=${(code as string).substring(0,8)}...`);
    const tokenRes = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(usesBasicAuth && {
          'Authorization': 'Basic ' + Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64')
        })
      },
      body: requestBody
    });

    debugLog(platform, `Token response status: ${tokenRes.status}`);

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[${platform}] Token exchange failed: ${errText}`);
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[${platform}] FAILED REQUEST DETAILS - url: ${provider.tokenUrl}`);
        console.error(`[${platform}] redirect_uri: ${redirectUri}`);
        console.error(`[${platform}] client_id: ${provider.clientId}`);
        console.error(`[${platform}] code (first 10): ${codeStr.substring(0,10)}, code length: ${codeStr.length}`);
        console.error(`[${platform}] code character codes: ${codeStr.split('').map(c => c.charCodeAt(0)).join(',')}`);
        console.error(`[${platform}] Request body sent (URL-decoded): ${decodeURIComponent(requestBody)}`);
      }
      // Try to parse error details
      try {
        const errObj = JSON.parse(errText);
        if (errObj.error?.fbtrace_id) {
          console.error(`[${platform}] FB Trace ID: ${errObj.error.fbtrace_id} - share this with Meta support`);
        }
      } catch (e2) { console.debug('Failed to parse OAuth error response:', e2) }
      throw new Error(`Failed to exchange code for token: ${errText}`);
    }

    const tokenData = await tokenRes.json() as any;
    debugLog(platform, `Token exchange successful`);
    
    // Slack sometimes nests the user token inside authed_user depending on the scopes requested
    if (platform === 'slack') {
       if (!tokenData.ok) {
           throw new Error(`Slack API Error: ${tokenData.error}`);
       }
       accessToken = tokenData.authed_user?.access_token || tokenData.access_token;
    } else {
       accessToken = tokenData.access_token || tokenData.accessToken;
    }
    
    refreshToken = tokenData.refresh_token || tokenData.refreshToken || null;
    tokenExpiresIn = tokenData.expires_in || 3600;

    if (!accessToken) throw new Error('No access token received from provider');

    // Threads: Exchange short-lived token (1 hour) for long-lived token (60 days)
    if (platform === 'threads') {
      try {
        const qs = new URLSearchParams({
          grant_type: 'th_exchange_token',
          client_secret: provider.clientSecret,
          access_token: accessToken,
        });
        const longLivedUrl = `https://graph.threads.net/access_token?${qs.toString()}`;
        debugLog('threads', 'Exchanging short-lived token for long-lived token');
        const longLivedRes = await fetch(longLivedUrl);
        if (longLivedRes.ok) {
          const longLivedData = await longLivedRes.json();
          if (longLivedData.access_token) {
            accessToken = longLivedData.access_token;
            tokenExpiresIn = longLivedData.expires_in || 5184000; // 60 days default
            debugLog('threads', `Long-lived token obtained, expires_in: ${tokenExpiresIn}s`);
          }
        } else {
          const errText = await longLivedRes.text();
          console.warn(`[threads] Long-lived exchange failed, using short-lived token: ${errText}`);
        }
      } catch (e) {
        console.warn(`[threads] Long-lived exchange error, using short-lived token:`, e);
      }
    }

    // Instagram: Exchange short-lived token (1 hour) for long-lived token (60 days)
    if (platform === 'instagram') {
      try {
        const qs = new URLSearchParams({
          grant_type: 'ig_exchange_token',
          client_secret: provider.clientSecret,
          access_token: accessToken,
        });
        const longLivedUrl = `https://graph.instagram.com/access_token?${qs.toString()}`;
        debugLog('instagram', 'Exchanging short-lived token for long-lived token');
        const longLivedRes = await fetch(longLivedUrl);
        if (longLivedRes.ok) {
          const longLivedData = await longLivedRes.json() as any;
          if (longLivedData.access_token) {
            accessToken = longLivedData.access_token;
            tokenExpiresIn = longLivedData.expires_in || 5184000; // 60 days default
            debugLog('instagram', `Long-lived token obtained, expires_in: ${tokenExpiresIn}s`);
          }
        } else {
          const errText = await longLivedRes.text();
          console.warn(`[instagram] Long-lived exchange failed, using short-lived token: ${errText}`);
        }
      } catch (e) {
        console.warn(`[instagram] Long-lived exchange error, using short-lived token:`, e);
      }
    }

    // Fetch user profile info from the platform
    const profileHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`
    };

    if (platform === 'x') {
      profileHeaders['User-Agent'] = 'SocialFlowApp';
    }

    // Special handling for Instagram - Instagram Login API returns profile directly
    let finalProfileUrl = provider.profileUrl;
    let finalProfileHeaders = { ...profileHeaders };
    let pageAccessToken = accessToken; // default to user token
    let igAccountType: string | null = null;
    
    if (platform === 'instagram') {
      // Instagram Login API returns user profile directly with account_type
      // No Facebook Pages lookup needed
      // Instagram Basic Display API requires access_token as URL query param, not Authorization header
      finalProfileUrl += `&access_token=${accessToken}`;
      finalProfileHeaders = {};
      console.log(`[${platform}] Using Instagram Login API - fetching profile`);
    }

    let profileData: any = {};
    const profileRes = await fetch(finalProfileUrl, {
      headers: finalProfileHeaders
    });

    if (!profileRes.ok) {
       const errBody = await profileRes.text().catch(() => '(unable to read body)');
       throw new Error(`Failed to fetch ${platform} profile: HTTP ${profileRes.status} - ${errBody}`);
    }

    profileData = await profileRes.json() as any;

    // Handle Instagram Login API data[] response wrapping (some API versions return data array)
    if (platform === 'instagram' && Array.isArray(profileData.data) && profileData.data.length > 0) {
      profileData = profileData.data[0];
      console.log(`[${platform}] Unwrapped data[] response format`);
    }

    // For Instagram, store the page access token for publishing
    if (platform === 'instagram') {
      accessToken = pageAccessToken;
    }
    
    // Normalize profile structure per platform
    // For Instagram, detect account_type from profile response
    if (platform === 'instagram') {
      igAccountType = profileData.user_id || profileData.account_type ? (profileData.account_type || null) : null;
      console.log(`[${platform}] Instagram account_type: ${igAccountType}`);
    }

    if (platform === 'linkedin') {
      profile.id = profileData.sub || profileData.id;
      profile.username = profileData.email || profileData.name?.replace(/\s+/g, '').toLowerCase() || 'linkedin_user';
      profile.displayName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
      profile.avatarUrl = profileData.picture || null;
    } else if (platform === 'x') {
      const userObj = profileData.data || {};
      profile.id = userObj.id;
      profile.username = userObj.username;
      profile.displayName = userObj.name;
      profile.avatarUrl = userObj.profile_image_url || null;
    } else if (platform === 'youtube') {
      profile.id = profileData.sub || profileData.id;
      profile.username = profileData.email || 'youtube_channel';
      profile.displayName = profileData.name || 'YouTube User';
      profile.avatarUrl = profileData.picture || null;
    } else if (platform === 'instagram') {
      // profileData is from Instagram Login API (graph.instagram.com)
      profile.id = profileData.user_id || profileData.id; // user_id in newer API versions
      profile.username = profileData.username;
      profile.displayName = profileData.username;
      profile.avatarUrl = profileData.profile_picture_url || null;
    } else if (platform === 'threads') {
      // profileData is from Threads API
      profile.id = profileData.id; // Threads profile ID
      profile.username = profileData.username;
      profile.displayName = profileData.name || profileData.username;
      profile.avatarUrl = profileData.threads_profile_picture_url || null;
    } else if (platform === 'facebook') {
      profile.id = profileData.id;
      profile.username = profileData.name?.replace(/\s+/g, '').toLowerCase();
      profile.displayName = profileData.name;
      profile.avatarUrl = profileData.picture?.data?.url || null;
    } else if (platform === 'gmb') {
       const userObj = profileData.accounts?.[0] || {};
       profile.id = userObj.name;
       profile.username = userObj.accountName?.replace(/\s+/g, '').toLowerCase() || 'gmb_account';
       profile.displayName = userObj.accountName || 'Google Business Profile';
       profile.avatarUrl = userObj.profilePhotoUrl || null;
    } else if (platform === 'pinterest') {
      profile.id = profileData.username;
      profile.username = profileData.username;
      profile.displayName = profileData.username;
      profile.avatarUrl = profileData.profile_image || null;
    } else if (platform === 'reddit') {
      profile.id = profileData.id;
      profile.username = profileData.name;
      profile.displayName = profileData.name;
      profile.avatarUrl = profileData.icon_img || null;
    } else if (platform === 'mastodon') {
      profile.id = profileData.id;
      profile.username = profileData.username;
      profile.displayName = profileData.display_name;
      profile.avatarUrl = profileData.avatar || null;
    } else if (platform === 'tumblr') {
       const userObj = profileData.response?.user || {};
       profile.id = userObj.name;
       profile.username = userObj.name;
       profile.displayName = userObj.name;
       profile.avatarUrl = null;
    } else if (platform === 'discord') {
       profile.id = profileData.id;
       profile.username = profileData.username;
       profile.displayName = profileData.global_name || profileData.username;
       profile.avatarUrl = profileData.avatar ? `https://cdn.discordapp.com/avatars/${profileData.id}/${profileData.avatar}.png` : null;
    } else if (platform === 'wordpress') {
       profile.id = String(profileData.ID);
       profile.username = profileData.username;
       profile.displayName = profileData.display_name;
       profile.avatarUrl = profileData.avatar_URL || null;
    }

    // Find user and their active workspace
    let user = await prisma.user.findUnique({
      where: { clerkId: resolvedClerkId },
      include: { memberships: { include: { workspace: true } } }
    });

    if (!user || user.memberships.length === 0) {
      const { users: clerkUsers } = require('@clerk/clerk-sdk-node');
      try {
        const clerkUser = await clerkUsers.getUser(resolvedClerkId);
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';
        const avatarUrl = clerkUser.imageUrl || null;
        const newUser = await prisma.user.create({
          data: { clerkId: resolvedClerkId, email, name, avatarUrl },
        });
        const workspace = await prisma.workspace.create({
          data: { name: `${name}'s Workspace`, slug: `workspace-${newUser.id}`, plan: 'PRO' },
        });
        await prisma.workspaceMember.create({
          data: { userId: newUser.id, workspaceId: workspace.id, role: 'OWNER' },
        });
        user = await prisma.user.findUnique({
          where: { clerkId: resolvedClerkId },
          include: { memberships: { include: { workspace: true } } },
        });
      } catch (syncErr) {
        console.error(`[${platform}] Auto-sync failed:`, syncErr);
        return res.status(404).send('User or Workspace not found');
      }
    }

    if (!user || user.memberships.length === 0) {
      return res.status(404).send('User or Workspace not found');
    }

    const workspaceId = user.memberships[0].workspaceId;

    // Encrypt tokens
    const encryptedAccess = encryptToken(accessToken, ENCRYPTION_KEY);
    const encryptedRefresh = refreshToken ? encryptToken(refreshToken, ENCRYPTION_KEY) : null;

    // Map string param to PlatformType Enum
    const mappedPlatform = platform.toUpperCase() as PlatformType;
    const tokenExpiresAt = new Date(Date.now() + tokenExpiresIn * 1000);

    // Determine connection type and account subtype
    const connectionType = 'API' as const;
    let igAccountSubtype: 'PERSONAL' | 'CREATOR' | 'BUSINESS' | undefined;
    if (platform === 'instagram' && igAccountType) {
      const t = igAccountType.toUpperCase();
      if (t === 'BUSINESS' || t === 'MEDIA_CREATOR' || t === 'CREATOR') igAccountSubtype = t === 'MEDIA_CREATOR' ? 'CREATOR' : t;
      else igAccountSubtype = 'BUSINESS'; // fallback
    }

    // Upsert Social Account
    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_platformAccountId: {
          workspaceId,
          platform: mappedPlatform,
          platformAccountId: profile.id
        }
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        tokenExpiresAt: tokenExpiresAt,
        connectionType,
        igAccountSubtype,
        updatedAt: new Date(),
      },
      create: {
        workspaceId,
        platform: mappedPlatform,
        platformAccountId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: tokenExpiresAt,
        connectionType,
        igAccountSubtype
      }
    });

    // Clear the Threads recovery cookie if it exists
    res.clearCookie('pending_oauth_user', { path: '/' });

    // Redirect back to frontend channels page
    res.redirect(`${FRONTEND_URL}/app/channels?success=true`);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    // Return the raw error to the browser so we can debug the silent failure
    res.status(500).send(`
      <html><body>
      <h2>OAuth Callback Failed</h2>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre>${error.stack}</pre>
      <a href="${FRONTEND_URL}/app/channels">Return to App</a>
      </body></html>
    `);
  }
});

router.post('/:platform/manual-connect', requireAuth, async (req: any, res: any) => {
  const { platform } = req.params;
  const { identifier, password, displayName, avatarUrl } = req.body;
  const clerkId = req.auth.userId;

  if (platform === 'instagram') {
    // Instagram manual connect: identifier = @handle, displayName/avatarUrl optional
    if (!identifier) {
      return res.status(400).json({ error: 'Instagram handle is required' });
    }
    // Validate handle format
    const handle = identifier.startsWith('@') ? identifier.slice(1) : identifier;
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
      return res.status(400).json({ error: 'Invalid Instagram handle format' });
    }
  } else if (platform === 'rss') {
    // RSS: identifier = feed URL, no password needed
    if (!identifier) {
      return res.status(400).json({ error: 'RSS feed URL is required' });
    }
    try {
      new URL(identifier);
    } catch {
      return res.status(400).json({ error: 'Invalid RSS feed URL format' });
    }
    // Try parsing the feed to validate it
    const parser = new Parser();
    try {
      const feed = await parser.parseURL(identifier);
      if (feed.title) {
        req.feedTitle = feed.title;
      }
    } catch {
      return res.status(400).json({ error: 'Could not fetch or parse RSS feed. Check the URL and try again.' });
    }
  } else {
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }
    if (platform !== 'bluesky' && platform !== 'telegram') {
      return res.status(400).json({ error: 'Manual connect is only supported for Bluesky, Telegram, Instagram, and RSS' });
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId as string },
      include: { memberships: { include: { workspace: true } } }
    });

    if (!user || user.memberships.length === 0) {
      return res.status(404).json({ error: 'User or Workspace not found' });
    }

    const workspaceId = user.memberships[0].workspaceId;

    let profileId = identifier;
    let finalDisplayName = displayName || identifier;
    let finalAvatarUrl = avatarUrl || null;
    let tokenExpiresAt = null;
    let connectionType = 'MANUAL' as const;
    let igAccountSubtype = 'PERSONAL' as const;

    if (platform === 'instagram') {
      // For Instagram manual: store handle in manualHandle, no tokens
      profileId = `manual_${identifier.startsWith('@') ? identifier.slice(1) : identifier}`;
    } else if (platform === 'rss') {
      profileId = `rss_${identifier}`;
      // Use parsed feed title if available
      finalDisplayName = (req as any).feedTitle || identifier;
    } else {
      // Bluesky/Telegram: store credentials in token fields
    }

    const mappedPlatform = platform.toUpperCase() as PlatformType;

    if (platform === 'instagram') {
      await prisma.socialAccount.upsert({
        where: {
          workspaceId_platform_platformAccountId: {
            workspaceId,
            platform: mappedPlatform,
            platformAccountId: profileId
          }
        },
        update: {
          manualHandle: identifier,
          manualDisplayName: finalDisplayName,
          manualAvatarUrl: finalAvatarUrl,
          connectionType,
          igAccountSubtype,
          updatedAt: new Date(),
        },
        create: {
          workspaceId,
          platform: mappedPlatform,
          platformAccountId: profileId,
          username: identifier,
          displayName: finalDisplayName,
          avatarUrl: finalAvatarUrl,
          connectionType,
          igAccountSubtype,
          manualHandle: identifier,
          manualDisplayName: finalDisplayName,
          manualAvatarUrl: finalAvatarUrl,
          tokenExpiresAt: null
        }
      });
    } else if (platform === 'rss') {
      await prisma.socialAccount.upsert({
        where: {
          workspaceId_platform_platformAccountId: {
            workspaceId,
            platform: mappedPlatform,
            platformAccountId: profileId
          }
        },
        update: {
          manualHandle: identifier,
          manualDisplayName: finalDisplayName,
          manualAvatarUrl: finalAvatarUrl,
          connectionType,
          updatedAt: new Date(),
        },
        create: {
          workspaceId,
          platform: mappedPlatform,
          platformAccountId: profileId,
          username: identifier,
          displayName: finalDisplayName,
          avatarUrl: finalAvatarUrl,
          connectionType,
          manualHandle: identifier,
          manualDisplayName: finalDisplayName,
          manualAvatarUrl: finalAvatarUrl,
          tokenExpiresAt: null
        }
      });
    } else {
      // Bluesky/Telegram: existing logic
      const encryptedAccess = encryptToken(password, ENCRYPTION_KEY);
      const encryptedRefresh = encryptToken(identifier, ENCRYPTION_KEY);

      await prisma.socialAccount.upsert({
        where: {
          workspaceId_platform_platformAccountId: {
            workspaceId,
            platform: mappedPlatform,
            platformAccountId: profileId
          }
        },
        update: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          updatedAt: new Date(),
        },
        create: {
          workspaceId,
          platform: mappedPlatform,
          platformAccountId: profileId,
          username: identifier,
          displayName: finalDisplayName,
          avatarUrl: finalAvatarUrl,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiresAt: tokenExpiresAt,
          connectionType,
          igAccountSubtype: undefined
        }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Manual Connect Error:', error);
    res.status(500).json({ error: 'Failed to securely store credentials' });
  }
});

// Mark manual post as done (self-reported)
router.patch('/posts/:postId/mark-posted', requireAuth, async (req: any, res: any) => {
  try {
    const { postId } = req.params;
    const clerkId = req.auth.userId;

    // Verify the post belongs to the user's workspace
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { accounts: { include: { socialAccount: true } } }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId as string },
      include: { memberships: { include: { workspace: true } } }
    });

    if (!user || user.memberships.length === 0 || user.memberships[0].workspaceId !== post.workspaceId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Find the manual Instagram account post
    const manualAccountPost = post.accounts.find(ap => 
      ap.socialAccount.platform === 'INSTAGRAM' && ap.socialAccount.connectionType === 'MANUAL'
    );

    if (!manualAccountPost) {
      return res.status(400).json({ error: 'No manual Instagram account found for this post' });
    }

    // Update status to MARKED_DONE
    await prisma.socialAccountPost.update({
      where: {
        postId_socialAccountId: {
          postId: post.id,
          socialAccountId: manualAccountPost.socialAccountId
        }
      },
      data: {
        status: 'MARKED_DONE',
        publishedAt: new Date()
      }
    });

    // Check if all account posts are done
    const allAccountPosts = await prisma.socialAccountPost.findMany({
      where: { postId: post.id }
    });

    const allDone = allAccountPosts.every(ap => 
      ap.status === 'PUBLISHED' || ap.status === 'MARKED_DONE'
    );

    if (allDone) {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED' }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Mark Posted Error:', error);
    res.status(500).json({ error: 'Failed to mark post as done' });
  }
});

export default router;
