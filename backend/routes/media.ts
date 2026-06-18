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
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
});

// POST /api/media/folders: Create a new folder
router.post('/folders', requireAuth, async (req: any, res: any) => {
  const { name, parentId } = req.body;
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const folder = await prisma.mediaFolder.create({
      data: {
        name,
        workspaceId,
        parentId: parentId || null
      }
    });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// GET /api/media/folders: Get all folders for workspace
router.get('/folders', requireAuth, async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    const folders = await prisma.mediaFolder.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// PATCH /api/media/folders/:id: Update a folder
router.patch('/folders/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const workspaceId = req.workspaceId;
    const folder = await prisma.mediaFolder.update({
      where: { id, workspaceId },
      data: { name }
    });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// DELETE /api/media/folders/:id: Delete a folder
router.delete('/folders/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const workspaceId = req.workspaceId;
    
    // We should decide if we delete assets inside or move them to root
    // For now, let's just delete the folder (assets will stay in DB but with a null/invalid folderId if not careful)
    // Actually, prisma onDelete: Cascade might handle this if configured, but let's be safe.
    await prisma.mediaAsset.updateMany({
      where: { folderId: id, workspaceId },
      data: { folderId: null }
    });

    await prisma.mediaFolder.delete({
      where: { id, workspaceId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// PATCH /api/media/:id: Update asset (e.g. move to folder)
router.patch('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const { folderId, fileName } = req.body;
  try {
    const workspaceId = req.workspaceId;
    const asset = await prisma.mediaAsset.update({
      where: { id, workspaceId },
      data: { 
        folderId: folderId === 'root' ? null : folderId,
        ...(fileName && { fileName })
      }
    });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
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
      Bucket: process.env.S3_BUCKET_NAME || '',
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
  const { fileName, fileUrl, fileType, fileSize, tags, folderId } = req.body;

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
        folderId: folderId || null,
        tags: tags || []
      }
    });

    // Generate a signed GET URL so the frontend can display it immediately
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || '',
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
  const { search, folderId, sort, type } = req.query;

  try {
    const workspaceId = req.workspaceId;
    
    if (!workspaceId) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const where: any = { workspaceId };

    if (search) {
      where.fileName = { contains: search as string, mode: 'insensitive' };
      if (folderId && folderId !== 'root') {
        where.folderId = folderId as string;
      }
    } else if (folderId === 'root') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId as string;
    }

    if (type && type !== 'all') {
      where.fileType = type === 'image' ? { startsWith: 'image/' } : { startsWith: 'video/' };
    }

    const orderBy: any = {};
    switch (sort) {
      case 'name': orderBy.fileName = 'asc'; break;
      case 'size': orderBy.fileSize = 'desc'; break;
      default: orderBy.createdAt = 'desc';
    }

    // Fetch assets and folders in parallel
    const [media, folders] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy,
      }),
      search
        ? []
        : prisma.mediaFolder.findMany({
            where: {
              workspaceId,
              parentId: folderId === 'root' ? null : (folderId as string || null)
            },
            orderBy: { createdAt: 'desc' }
          })
    ]);

    // --- HIGH PERFORMANCE RETRIEVAL ---
    // Try B2 download auth token first (fast, single token for all assets)
    // Fall back to individual signed URLs if that fails
    
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
      console.error('Failed to get B2 download auth, will sign individually', e);
    }

    const baseUrl = `https://f005.backblazeb2.com/file/${process.env.S3_BUCKET_NAME}`;

    const mediaWithUrls = await Promise.all(media.map(async (item) => {
      const key = item.fileUrl.includes('http') 
          ? item.fileUrl.split('/').slice(-2).join('/') 
          : item.fileUrl;

      let fileUrl: string;
      if (downloadToken) {
        fileUrl = `${baseUrl}/${key}?Authorization=${downloadToken}`;
      } else {
        // Fallback: generate individual signed URL (reliable)
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || '',
            Key: key
          });
          fileUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (signErr) {
          console.error('Failed to sign URL for asset', item.id, signErr);
          fileUrl = key;
        }
      }
          
      return { 
        ...item, 
        fileUrl,
        s3Key: key 
      };
    }));

    res.json({ assets: mediaWithUrls, folders });
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
        Bucket: process.env.S3_BUCKET_NAME || '',
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
