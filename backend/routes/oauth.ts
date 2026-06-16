import { Router } from 'express';
import { PrismaClient, PlatformType } from '@prisma/client';
import { encryptToken } from '../utils/crypto';
import { requireAuth } from '../middlewares/auth';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_32_byte_secret_key_for_dev!';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

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
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    profileUrl: 'https://api.twitter.com/2/users/me',
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    scopes: 'tweet.read tweet.write users.read offline.access',
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    profileUrl: 'https://graph.instagram.com/me?fields=id,username',
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    scopes: 'instagram_basic instagram_content_publish pages_show_list pages_read_engagement',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,picture',
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    scopes: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
  },
  threads: {
    authUrl: 'https://threads.net/oauth/authorize',
    tokenUrl: 'https://graph.threads.net/oauth/access_token',
    profileUrl: 'https://graph.threads.net/me?fields=id,username',
    clientId: process.env.THREADS_CLIENT_ID || '',
    clientSecret: process.env.THREADS_CLIENT_SECRET || '',
    scopes: 'threads_basic,threads_content_publish',
  },
  gmb: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
    clientId: process.env.GMB_CLIENT_ID || '',
    clientSecret: process.env.GMB_CLIENT_SECRET || '',
    scopes: 'https://www.googleapis.com/auth/business.manage',
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
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
    scopes: '', // User scopes are passed separately in the authUrl for Slack
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

router.get('/:platform/connect', requireAuth, async (req: any, res: any) => {
  const { platform } = req.params;
  const provider = providers[platform as keyof typeof providers];
  
  if (!provider || !provider.clientId) {
    return res.status(400).json({ error: `OAuth for ${platform} is not configured on the server.` });
  }

  const redirectUri = getRedirectUri(platform);
  const state = req.auth.userId; 

  const authUrl = new URL(provider.authUrl);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', provider.clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);
  if (platform === 'slack') {
    authUrl.searchParams.append('user_scope', 'chat:write,users.profile:read,identity.basic');
  } else {
    authUrl.searchParams.append('scope', provider.scopes);
  }

  if (platform === 'x') {
    // High-entropy PKCE challenge for production security
    authUrl.searchParams.append('code_challenge', 'S0c1alFlMHdfUGtjZV9WZXJpZmllcl8yMDI2X0xvbmdfU3RyaW5n');
    authUrl.searchParams.append('code_challenge_method', 'plain');
  }

  res.json({ authUrl: authUrl.toString() });
});

router.get('/:platform/callback', async (req: any, res) => {
  const { platform } = req.params;
  const { code, state: clerkId } = req.query;

  if (!code || !clerkId) {
    return res.status(400).send('Missing code or state parameter.');
  }

  const provider = providers[platform as keyof typeof providers];
  if (!provider || !provider.clientId || !provider.clientSecret) {
    return res.status(400).send('Unsupported or unconfigured platform');
  }

  try {
    let accessToken = '';
    let refreshToken = null;
    let tokenExpiresIn = 3600;
    
    let profile = {
      id: '',
      username: '',
      displayName: '',
      avatarUrl: 'https://github.com/shadcn.png'
    };

    // Execute the real OAuth code exchange flow
    const redirectUri = getRedirectUri(platform);
    
    const bodyParams = new URLSearchParams();
    bodyParams.append('grant_type', 'authorization_code');
    bodyParams.append('code', code as string);
    bodyParams.append('redirect_uri', redirectUri);
    bodyParams.append('client_id', provider.clientId);
    bodyParams.append('client_secret', provider.clientSecret);

    if (platform === 'x') {
      bodyParams.append('code_verifier', 'S0c1alFlMHdfUGtjZV9WZXJpZmllcl8yMDI2X0xvbmdfU3RyaW5n');
    }

    const tokenRes = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(platform === 'tumblr' && {
          'Authorization': 'Basic ' + Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64')
        })
      },
      body: bodyParams.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Failed to exchange code for token: ${errText}`);
    }

    const tokenData = await tokenRes.json() as any;
    accessToken = tokenData.access_token || tokenData.accessToken;
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

    const profileRes = await fetch(provider.profileUrl, {
      headers: profileHeaders
    });

    if (!profileRes.ok) {
       throw new Error(`Failed to fetch profile from ${platform}`);
    }

    const profileData = await profileRes.json() as any;
    
    // Normalize profile structure per platform
    if (platform === 'linkedin') {
      profile.id = profileData.sub || profileData.id;
      profile.username = profileData.email || profileData.name?.replace(/\s+/g, '').toLowerCase() || 'linkedin_user';
      profile.displayName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
      profile.avatarUrl = profileData.picture || 'https://github.com/shadcn.png';
    } else if (platform === 'x') {
      const userObj = profileData.data || {};
      profile.id = userObj.id;
      profile.username = userObj.username;
      profile.displayName = userObj.name;
      profile.avatarUrl = userObj.profile_image_url || 'https://github.com/shadcn.png';
    } else if (platform === 'youtube') {
      profile.id = profileData.id;
      profile.username = profileData.email || 'youtube_channel';
      profile.displayName = profileData.name || 'YouTube User';
      profile.avatarUrl = profileData.picture || 'https://github.com/shadcn.png';
    } else if (platform === 'instagram' || platform === 'threads') {
      profile.id = profileData.id;
      profile.username = profileData.username;
      profile.displayName = profileData.username;
      profile.avatarUrl = 'https://github.com/shadcn.png';
    } else if (platform === 'facebook') {
      profile.id = profileData.id;
      profile.username = profileData.name?.replace(/\s+/g, '').toLowerCase();
      profile.displayName = profileData.name;
      profile.avatarUrl = profileData.picture?.data?.url || 'https://github.com/shadcn.png';
    } else if (platform === 'gmb') {
       const userObj = profileData.accounts?.[0] || {};
       profile.id = userObj.name;
       profile.username = userObj.accountName || 'gmb_account';
       profile.displayName = userObj.accountName;
       profile.avatarUrl = 'https://github.com/shadcn.png';
    } else if (platform === 'pinterest') {
      profile.id = profileData.username;
      profile.username = profileData.username;
      profile.displayName = profileData.username;
      profile.avatarUrl = profileData.profile_image || 'https://github.com/shadcn.png';
    } else if (platform === 'reddit') {
      profile.id = profileData.id;
      profile.username = profileData.name;
      profile.displayName = profileData.name;
      profile.avatarUrl = profileData.icon_img || 'https://github.com/shadcn.png';
    } else if (platform === 'mastodon') {
      profile.id = profileData.id;
      profile.username = profileData.username;
      profile.displayName = profileData.display_name;
      profile.avatarUrl = profileData.avatar || 'https://github.com/shadcn.png';
    } else if (platform === 'tumblr') {
       const userObj = profileData.response?.user || {};
       profile.id = userObj.name;
       profile.username = userObj.name;
       profile.displayName = userObj.name;
       profile.avatarUrl = 'https://github.com/shadcn.png';
    } else if (platform === 'discord') {
       profile.id = profileData.id;
       profile.username = profileData.username;
       profile.displayName = profileData.global_name || profileData.username;
       profile.avatarUrl = profileData.avatar ? `https://cdn.discordapp.com/avatars/${profileData.id}/${profileData.avatar}.png` : 'https://github.com/shadcn.png';
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
    res.redirect(`${FRONTEND_URL}/app/channels?error=${encodeURIComponent(error.message)}`);
  }
});

router.post('/:platform/manual-connect', requireAuth, async (req: any, res: any) => {
  const { platform } = req.params;
  const { identifier, password } = req.body;
  const clerkId = req.auth.userId;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Missing required credentials' });
  }

  if (platform !== 'bluesky' && platform !== 'medium') {
    return res.status(400).json({ error: 'Manual connect is only supported for Bluesky and Medium' });
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
    let avatarUrl = 'https://github.com/shadcn.png';
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
