import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '../middlewares/auth';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import crypto from 'crypto';

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

// POST /api/uploads/google-drive — download a file from Google Drive and register it
router.post('/google-drive', requireAuth, async (req: any, res: any) => {
  const { fileId, fileName, folderId } = req.body;
  if (!fileId) return res.status(400).json({ error: 'fileId is required' });

  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    // Download from Google Drive
    const driveResp = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
      redirect: 'follow',
    });

    if (!driveResp.ok) {
      return res.status(400).json({ error: 'Failed to download file from Google Drive. Make sure the file is publicly accessible.' });
    }

    const arrayBuffer = await driveResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = driveResp.headers.get('content-type') || 'application/octet-stream';
    const resolvedFileName = fileName || `drive-${fileId}`;
    const fileSize = buffer.length;

    // Generate S3 key
    const s3Key = `workspaces/${workspaceId}/${crypto.randomUUID()}-${resolvedFileName}`;

    // Upload to S3
    const bucket = process.env.S3_BUCKET || 'socialflow';
    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(uploadCommand);

    const s3Endpoint = process.env.S3_ENDPOINT?.startsWith('http')
      ? process.env.S3_ENDPOINT
      : `https://${process.env.S3_ENDPOINT}`;
    const fileUrl = `${s3Endpoint}/${bucket}/${s3Key}`;

    // Register in database
    const asset = await prisma.mediaAsset.create({
      data: {
        fileName: resolvedFileName,
        fileUrl,
        fileType: contentType,
        fileSize,
        folderId: folderId || null,
        workspaceId,
      },
    });

    res.json(asset);
  } catch (error) {
    console.error('Google Drive import error:', error);
    res.status(500).json({ error: 'Failed to import from Google Drive' });
  }
});

export default router;
