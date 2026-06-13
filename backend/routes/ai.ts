import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';
import { requireAuth } from '../middlewares/auth';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

// Utility to log AI usage
const logAiUsage = async (userId: string, toolUsed: string, prompt: string, tokensUsed?: number, imagesGenerated?: number) => {
  try {
    await prisma.aiGenerationLog.create({
      data: {
        userId,
        toolUsed,
        prompt,
        tokensUsed,
        imagesGenerated
      }
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
};

router.post('/caption', requireAuth, async (req: any, res: any) => {
  const { prompt, tone, platform } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
    return res.status(500).json({ error: 'AI services not configured. Please add OPENAI_API_KEY to your environment.' });
  }

  try {
    const userId = req.userId;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an expert social media manager. Generate 3 variations of a caption for ${platform} with a ${tone} tone. Return the response strictly as a JSON array of strings.` },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;
    let variations = [];
    try {
      const parsed = JSON.parse(responseText || '{}');
      variations = parsed.variations || parsed.captions || Object.values(parsed)[0];
      if (!Array.isArray(variations)) variations = [responseText];
    } catch (e) {
      variations = [responseText];
    }

    await logAiUsage(userId, 'caption', prompt, completion.usage?.total_tokens || 0);

    return res.json({ variations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
});

router.post('/hashtags', requireAuth, async (req: any, res: any) => {
  const { niche, keywords } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
    return res.status(500).json({ error: 'AI services not configured.' });
  }

  try {
    const userId = req.userId;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an SEO expert. Generate a list of top trending and contextually relevant hashtags for the given niche/keywords. Return strictly as a JSON array of strings (including the # symbol).` },
        { role: 'user', content: `Niche: ${niche}, Keywords: ${keywords}` }
      ],
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;
    let hashtags = [];
    try {
      const parsed = JSON.parse(responseText || '{}');
      hashtags = parsed.hashtags || Object.values(parsed)[0];
    } catch (e) {
      hashtags = [];
    }

    await logAiUsage(userId, 'hashtags', `${niche} ${keywords}`, completion.usage?.total_tokens || 0);
    return res.json({ hashtags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

router.post('/ideas', requireAuth, async (req: any, res: any) => {
  const { topic, industry } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
    return res.status(500).json({ error: 'AI services not configured.' });
  }

  try {
    const userId = req.userId;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Generate a 30-day content plan. Return JSON strictly in this format: { "ideas": [ { "day": 1, "topic": "...", "description": "..." } ] }` },
        { role: 'user', content: `Topic: ${topic}, Industry: ${industry}` }
      ],
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;
    let ideas = [];
    try {
      ideas = JSON.parse(responseText || '{}').ideas || [];
    } catch (e) {}

    await logAiUsage(userId, 'ideas', `${topic} ${industry}`, completion.usage?.total_tokens || 0);
    return res.json({ ideas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate ideas' });
  }
});

router.post('/image', requireAuth, async (req: any, res: any) => {
  const { imagePrompt, aspectRatio } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
    return res.status(500).json({ error: 'AI services not configured.' });
  }

  try {
    const userId = req.userId;
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

    let size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
    if (aspectRatio === '16:9') size = '1792x1024';
    if (aspectRatio === '9:16') size = '1024x1792';

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: size,
    });

    const imageUrl = response?.data?.[0]?.url || '';
    if (!imageUrl) throw new Error('No image URL returned from OpenAI');

    await logAiUsage(userId, 'image', imagePrompt, undefined, 1);

    let finalUrl = imageUrl;

    if (process.env.S3_BUCKET_NAME) {
      const s3Client = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      });

      const imageRes = await fetch(imageUrl);
      const buffer = await imageRes.buffer();
      const fileName = `ai-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/png',
      }));

      finalUrl = process.env.S3_PUBLIC_URL ? `${process.env.S3_PUBLIC_URL}/${fileName}` : `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        workspaceId,
        userId: userId,
        fileName: `AI-Generated-${Date.now()}.png`,
        fileUrl: finalUrl,
        fileType: 'image/png',
        fileSize: 0,
        tags: ['ai-generated']
      }
    });

    res.json({ url: finalUrl, asset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
