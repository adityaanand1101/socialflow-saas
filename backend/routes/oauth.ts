import { Router } from 'express';
import { PrismaClient, PlatformType } from '@prisma/client';
import { encryptToken } from '../utils/crypto';
import { requireAuth } from '../middlewares/auth';
import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// In-memory store for PKCE code_verifiers (keyed by Clerk userId / state param)
const pkceStore = new Map<string, string>();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
if (!ENCRYPTION_KEY) {
  console.error('CRITICAL: ENCRYPTION_KEY not set — OAuth token encryption will fail');
}
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://socialflow-saas.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://socialflow-saas.onrender.com';

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
    // Instagram Graph API uses Facebook Login with Instagram scopes
    authUrl: 'https://www.facebook.com/v22.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token',
    // Get user's Facebook Pages + Instagram Business Accounts
    profileUrl: 'https://graph.facebook.com/v22.0/me?fields=id,name,accounts{id,name,access_token,instagram_business_account{id,username,profile_picture_url}}',
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    scopes: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights',
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
    // Threads API uses Facebook Login with Threads scopes
    authUrl: 'https://www.facebook.com/v22.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token',
    // Get user's Facebook Pages that have Threads linked
    profileUrl: 'https://graph.facebook.com/v22.0/me?fields=id,name,accounts{id,name,access_token,threads_profile{id,username,name,profile_picture_url}}',
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    scopes: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,threads_basic,threads_content_publish',
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
    authUrl: `${process.env.MASTODON_INSTANCE_URL}/oauth/authorize`, 
    tokenUrl: `${process.env.MASTODON_INSTANCE_URL}/oauth/token`,
    profileUrl: `${process.env.MASTODON_INSTANCE_URL}/api/v1/accounts/verify_credentials`,
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
    const state = req.auth.userId; 

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

  if (!code || !clerkId) {
    console.error(`[${platform}] Missing code or state parameter`);
    return res.status(400).send('Missing code or state parameter.');
  }

  const provider = providers[platform as keyof typeof providers];
  if (!provider || !provider.clientId || !provider.clientSecret) {
    console.error(`[${platform}] Provider not configured`);
    return res.status(400).send('Unsupported or unconfigured platform');
  }

  console.log(`[${platform}] OAuth callback - code received, exchanging for token...`);

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
    const redirectUri = getRedirectUri(platform);
    console.log(`[${platform}] Token exchange - redirectUri: ${redirectUri}`);
    
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
      const codeVerifier = pkceStore.get(clerkId as string);
      if (codeVerifier) {
        bodyParams.append('code_verifier', codeVerifier);
        pkceStore.delete(clerkId as string);
      }
    }

    const usesBasicAuth = platform === 'tumblr' || platform === 'slack' || platform === 'x';

    console.log(`[${platform}] Exchanging code at ${provider.tokenUrl}`);
    const tokenRes = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(usesBasicAuth && {
          'Authorization': 'Basic ' + Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64')
        })
      },
      body: bodyParams.toString()
    });

    console.log(`[${platform}] Token response status: ${tokenRes.status}`);

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[${platform}] Token exchange failed: ${errText}`);
      throw new Error(`Failed to exchange code for token: ${errText}`);
    }

    const tokenData = await tokenRes.json() as any;
    console.log(`[${platform}] Token exchange successful`);
    
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

    // Fetch user profile info from the platform
    const profileHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`
    };

    if (platform === 'x') {
      profileHeaders['User-Agent'] = 'SocialFlowApp';
    }

    // Special handling for Instagram and Threads - need to fetch Page access token first
    let finalProfileUrl = provider.profileUrl;
    let finalProfileHeaders = { ...profileHeaders };
    let pageAccessToken = accessToken; // default to user token
    
    if (platform === 'instagram' || platform === 'threads') {
      // First, get user's Facebook Pages to find the one with Instagram/Threads
      const pagesRes = await fetch('https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url},threads_profile{id,username,name,profile_picture_url}', {
        headers: profileHeaders
      });
      
      if (!pagesRes.ok) {
        const errBody = await pagesRes.text().catch(() => '');
        throw new Error(`Failed to fetch Facebook pages: HTTP ${pagesRes.status} - ${errBody}`);
      }
      
      const pagesData = await pagesRes.json() as any;
      const pages = pagesData.data || [];
      
      console.log(`[${platform}] Found ${pages.length} Facebook pages`);
      
      // Find page with Instagram Business Account (for Instagram) or Threads profile (for Threads)
      let targetPage = null;
      
      if (platform === 'instagram') {
        targetPage = pages.find((page: any) => page.instagram_business_account);
      } else if (platform === 'threads') {
        targetPage = pages.find((page: any) => page.threads_profile);
      }
      
      if (!targetPage) {
        throw new Error(
          platform === 'instagram' 
            ? 'No Instagram Business Account found. Make sure you have an Instagram Business/Creator account connected to a Facebook Page you manage.'
            : 'No Threads profile found. Make sure you have Threads connected to a Facebook Page you manage.'
        );
      }
      
      console.log(`[${platform}] Found target page: ${targetPage.name} (${targetPage.id})`);
      
      // Use the Page Access Token for Instagram/Threads API calls
      pageAccessToken = targetPage.access_token;
      finalProfileHeaders = { 'Authorization': `Bearer ${pageAccessToken}` };
      
      if (platform === 'instagram') {
        const igAccount = targetPage.instagram_business_account;
        // Use the Instagram Graph API endpoint for the business account
        finalProfileUrl = `https://graph.facebook.com/v22.0/${igAccount.id}?fields=id,username,profile_picture_url`;
      } else if (platform === 'threads') {
        const threadsProfile = targetPage.threads_profile;
        // Use the Threads API endpoint
        finalProfileUrl = `https://graph.threads.net/v1.0/${threadsProfile.id}?fields=id,username,name,profile_picture_url`;
      }
    }

    const profileRes = await fetch(finalProfileUrl, {
      headers: finalProfileHeaders
    });

    if (!profileRes.ok) {
       const errBody = await profileRes.text().catch(() => '(unable to read body)');
       throw new Error(`Failed to fetch ${platform} profile: HTTP ${profileRes.status} - ${errBody}`);
    }

    const profileData = await profileRes.json() as any;
    
    // For Instagram/Threads, also store the page access token for publishing
    if (platform === 'instagram' || platform === 'threads') {
      // We'll store the page access token as the refreshToken for later use in publishing
      // This allows us to make API calls with the correct page-level token
      accessToken = pageAccessToken;
    }
    
    // Normalize profile structure per platform
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
      // profileData is from Instagram Graph API
      profile.id = profileData.id; // Instagram Business Account ID
      profile.username = profileData.username;
      profile.displayName = profileData.username;
      profile.avatarUrl = profileData.profile_picture_url || null;
    } else if (platform === 'threads') {
      // profileData is from Threads API
      profile.id = profileData.id; // Threads profile ID
      profile.username = profileData.username;
      profile.displayName = profileData.name || profileData.username;
      profile.avatarUrl = profileData.profile_picture_url || null;
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
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId as string },
      include: { memberships: { include: { workspace: true } } }
    });

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
        tokenExpiresAt: tokenExpiresAt
      }
    });

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
  const { identifier, password } = req.body;
  const clerkId = req.auth.userId;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  if (platform !== 'bluesky' && platform !== 'telegram') {
    return res.status(400).json({ error: 'Manual connect is only supported for Bluesky and Telegram' });
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
    let displayName = identifier;
    let avatarUrl: string | null = null;
    let tokenExpiresAt = null; // These tokens typically don't expire automatically

    // Optional: Add logic here to verify the tokens against the platform APIs
    // e.g. Call Bluesky ATP server or Medium API to ensure credentials are valid
    // For now, we trust the input and store it securely.

    const mappedPlatform = platform.toUpperCase() as PlatformType;
    
    // We store the 'identifier' in refreshToken and 'password' in accessToken
    // This allows us to reuse the existing encrypted storage structure
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
        displayName: displayName,
        avatarUrl: avatarUrl,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: tokenExpiresAt // null means never expires
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Manual Connect Error:', error);
    res.status(500).json({ error: 'Failed to securely store credentials' });
  }
});

export default router;
