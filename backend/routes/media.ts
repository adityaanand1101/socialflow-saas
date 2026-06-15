import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { requireAuth } from '../middlewares/auth';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT?.startsWith('http') 
    ? process.env.S3_ENDPOINT 
    : `https://${process.env.S3_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'dummy-access-key',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'dummy-secret-key',
  },
});

router.post('/presigned-url', requireAuth, async (req: any, res: any) => {
  const { fileName, fileType, fileSize } = req.body;

  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Secure the file path with workspaceId to prevent overwriting
    const key = `${workspaceId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'dummy-bucket',
      Key: key,
      ContentType: fileType,
    });

    // Signed URL expires in 15 minutes for uploading
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // For a private bucket, the fileUrl is just the key for database storage
    // We will generate a viewUrl on the fly when fetching
    const fileUrl = key; 

    res.json({ uploadUrl, fileUrl, key });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

router.post('/register', requireAuth, async (req: any, res: any) => {
  const { fileName, fileUrl, fileType, fileSize, tags } = req.body;

  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        workspaceId,
        userId: req.userId,
        fileName,
        fileUrl, // This is the S3 Key
        fileType,
        fileSize,
        tags: tags || []
      }
    });

    // Generate a signed GET URL so the frontend can display it immediately
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'dummy-bucket',
      Key: fileUrl
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ ...asset, fileUrl: signedUrl });
  } catch (error) {
    console.error('Error registering media asset:', error);
    res.status(500).json({ error: 'Failed to register media asset' });
  }
});

router.get('/', requireAuth, async (req: any, res: any) => {
  const { search } = req.query;

  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const media = await prisma.mediaAsset.findMany({
      where: { 
        workspaceId,
        ...(search ? { fileName: { contains: search as string, mode: 'insensitive' } } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    // --- HIGH PERFORMANCE RETRIEVAL ---
    // Instead of signing 50 URLs, we generate ONE download authorization token for the workspace prefix.
    // This is much faster and more efficient.
    
    let downloadToken = '';
    const keyId = process.env.S3_ACCESS_KEY_ID;
    const appKey = process.env.S3_SECRET_ACCESS_KEY;
    const bucketId = '9ea4b8846d51bcfa96eb0c10'; // Your Socialflow bucket ID

    try {
      const authBase64 = Buffer.from(`${keyId}:${appKey}`).toString('base64');
      const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { 'Authorization': `Basic ${authBase64}` }
      });
      const authData: any = await authRes.json();
      
      const tokenRes = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_download_authorization`, {
        method: 'POST',
        headers: { 'Authorization': authData.authorizationToken },
        body: JSON.stringify({
          bucketId: bucketId,
          fileNamePrefix: `${workspaceId}/`,
          validDurationInSeconds: 3600
        })
      });
      const tokenData: any = await tokenRes.json();
      downloadToken = tokenData.authorizationToken;
    } catch (e) {
      console.error('Failed to get B2 download auth, falling back to slow signing', e);
    }

    const baseUrl = `https://f005.backblazeb2.com/file/${process.env.S3_BUCKET_NAME}`;

    const mediaWithUrls = media.map((item) => {
      const key = item.fileUrl.includes('http') 
          ? item.fileUrl.split('/').slice(-2).join('/') 
          : item.fileUrl;
          
      return { 
        ...item, 
        fileUrl: downloadToken 
          ? `${baseUrl}/${key}?Authorization=${downloadToken}`
          : item.fileUrl, // Fallback if token fails
        s3Key: key 
      };
    });

    res.json(mediaWithUrls);
  } catch (error) {
    console.error('Error fetching media assets:', error);
    res.status(500).json({ error: 'Failed to fetch media assets' });
  }
});

router.delete('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });

    if (!asset || asset.workspaceId !== workspaceId) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Attempt to delete from S3
    // Extract key from URL
    try {
      const urlParts = asset.fileUrl.split('/');
      // Reconstruct key: workspaceId/filename
      const key = `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;

      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'dummy-bucket',
        Key: key,
      }));
    } catch (s3Error) {
      console.error('Failed to delete file from S3:', s3Error);
      // Decide whether to fail the whole request or just proceed to delete DB record
    }

    await prisma.mediaAsset.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting media asset:', error);
    res.status(500).json({ error: 'Failed to delete media asset' });
  }
});

export default router;
