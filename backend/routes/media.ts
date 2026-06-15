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

    // Generate signed GET URLs for each asset for private viewing
    const mediaWithSignedUrls = await Promise.all(media.map(async (item) => {
      try {
        // If fileUrl is a full URL, try to extract key, else assume it's already the key
        const key = item.fileUrl.includes('http') 
          ? item.fileUrl.split('/').slice(-2).join('/') // Handles workspaceId/filename
          : item.fileUrl;

        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'dummy-bucket',
          Key: key
        });

        // Signed URL expires in 1 hour
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        return { ...item, fileUrl: signedUrl, s3Key: key };
      } catch (e) {
        console.error(`Failed to sign URL for ${item.id}`, e);
        return item;
      }
    }));

    res.json(mediaWithSignedUrls);
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
