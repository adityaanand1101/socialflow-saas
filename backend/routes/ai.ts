import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '../middlewares/auth';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// ---------- Config ----------

const AI_MODELS = {
  caption: process.env.AI_MODEL_CAPTION || 'gemini-2.5-flash',
  hashtags: process.env.AI_MODEL_HASHTAGS || 'gemini-2.5-flash',
  ideas: process.env.AI_MODEL_IDEAS || 'gemini-2.5-flash',
  image: process.env.AI_MODEL_IMAGE || 'gemini-2.5-flash-image',
} as const;

const ALLOWED_TONES = ['Professional', 'Casual', 'Funny', 'Inspirational', 'Urgent', 'Educational'] as const;
const ALLOWED_PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'Threads', 'YouTube'] as const;

const PLATFORM_MAP: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  x: 'Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};

const GEMINI_AI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
  : null;

// ---------- Helpers ----------

function extractJsonArray<T>(text: string, key: string, fallback: (text: string) => T[]): T[] {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return (parsed[key] || Object.values(parsed)[0]) as T[];
  } catch {
    return fallback(text);
  }
}

function buildPublicUrl(fileName: string): string {
  if (process.env.S3_PUBLIC_URL) {
    const base = process.env.S3_PUBLIC_URL.replace(/\/+$/, '');
    return `${base}/${fileName}`;
  }
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
}

async function checkAiRateLimit(userId: string): Promise<number | null> {
  try {
    const recent = await prisma.aiGenerationLog.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 3_600_000) },
      },
    });
    const limit = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '50', 10);
    if (recent >= limit) return recent;
    return null;
  } catch {
    return null;
  }
}

async function logAiUsage(userId: string, toolUsed: string, prompt: string, tokensUsed?: number, imagesGenerated?: number) {
  try {
    await prisma.aiGenerationLog.create({
      data: {
        userId,
        toolUsed,
        prompt: prompt.slice(0, 1000),
        tokensUsed: tokensUsed || 0,
        imagesGenerated: imagesGenerated || 0,
      },
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
}

// ---------- Routes ----------

router.post('/caption', requireAuth, async (req: any, res: any) => {
  let { prompt, tone, platform } = req.body;
  const userId = req.userId;

  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  platform = PLATFORM_MAP[platform?.toLowerCase()] || '';
  if (platform && !ALLOWED_PLATFORMS.includes(platform as any)) {
    return res.status(400).json({ error: `Invalid platform. Allowed: ${ALLOWED_PLATFORMS.join(', ')}` });
  }
  if (tone && !ALLOWED_TONES.includes(tone as any)) {
    return res.status(400).json({ error: `Invalid tone. Allowed: ${ALLOWED_TONES.join(', ')}` });
  }
  if (!GEMINI_AI) return res.status(503).json({ error: 'AI service unavailable' });

  const hit = await checkAiRateLimit(userId);
  if (hit !== null) return res.status(429).json({ error: `Rate limit exceeded (${hit + 1} requests this hour)` });

  try {
    const response = await GEMINI_AI.models.generateContent({
      model: AI_MODELS.caption,
      contents: [{ role: 'user', parts: [{ text: `You are an expert social media manager. Generate 3 variations of a caption for ${platform || 'Instagram'} with a ${tone || 'Professional'} tone. Return the response strictly as a JSON object with a "variations" key containing an array of strings.\n\nUser Request: ${prompt.slice(0, 2000)}` }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const variations = extractJsonArray<string>(text, 'variations', (t) => [t]);

    await logAiUsage(userId, 'caption', prompt);
    return res.json({ variations: Array.isArray(variations) ? variations : [variations] });
  } catch (error: any) {
    console.error('AI Caption Error:', error);
    return res.status(500).json({ error: 'Failed to generate caption' });
  }
});

router.post('/hashtags', requireAuth, async (req: any, res: any) => {
  const { niche, keywords } = req.body;
  const userId = req.userId;

  if (!niche || !String(niche).trim()) {
    return res.status(400).json({ error: 'niche is required' });
  }
  if (!GEMINI_AI) return res.status(503).json({ error: 'AI service unavailable' });

  const hit = await checkAiRateLimit(userId);
  if (hit !== null) return res.status(429).json({ error: `Rate limit exceeded (${hit + 1} requests this hour)` });

  try {
    const response = await GEMINI_AI.models.generateContent({
      model: AI_MODELS.hashtags,
      contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. Generate a list of top trending and contextually relevant hashtags for the given niche and keywords. Return strictly as a JSON object with a "hashtags" key containing an array of strings (including the # symbol).\n\nNiche: ${niche.slice(0, 500)}, Keywords: ${(keywords || niche).slice(0, 500)}` }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const hashtags = extractJsonArray<string>(text, 'hashtags', (t) => t.split(' ').filter((w: string) => w.startsWith('#')));

    await logAiUsage(userId, 'hashtags', `${niche} ${keywords || ''}`);
    return res.json({ hashtags: Array.isArray(hashtags) ? hashtags : [] });
  } catch (error: any) {
    console.error('AI Hashtag Error:', error);
    return res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

router.post('/ideas', requireAuth, async (req: any, res: any) => {
  const { topic, industry } = req.body;
  const userId = req.userId;

  if (!topic || !String(topic).trim()) {
    return res.status(400).json({ error: 'topic is required' });
  }
  if (!GEMINI_AI) return res.status(503).json({ error: 'AI service unavailable' });

  const hit = await checkAiRateLimit(userId);
  if (hit !== null) return res.status(429).json({ error: `Rate limit exceeded (${hit + 1} requests this hour)` });

  try {
    const response = await GEMINI_AI.models.generateContent({
      model: AI_MODELS.ideas,
      contents: [{ role: 'user', parts: [{ text: `Generate a 30-day social media content plan. Return JSON strictly in this format: { "ideas": [ { "day": 1, "topic": "...", "description": "..." } ] }\n\nTopic: ${topic.slice(0, 500)}, Industry: ${(industry || topic).slice(0, 500)}` }] }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const ideas = extractJsonArray<{ day: number; topic: string; description: string }>(text, 'ideas', () => []);

    await logAiUsage(userId, 'ideas', `${topic} ${industry || ''}`);
    return res.json({ ideas });
  } catch (error: any) {
    console.error('AI Ideas Error:', error);
    return res.status(500).json({ error: 'Failed to generate content plan' });
  }
});

router.post('/image', requireAuth, async (req: any, res: any) => {
  const { imagePrompt, aspectRatio } = req.body;
  const userId = req.userId;
  const workspaceId = req.workspaceId;

  if (!imagePrompt || !String(imagePrompt).trim()) {
    return res.status(400).json({ error: 'imagePrompt is required' });
  }
  if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });
  if (!GEMINI_AI) return res.status(503).json({ error: 'AI service unavailable' });

  const hit = await checkAiRateLimit(userId);
  if (hit !== null) return res.status(429).json({ error: `Rate limit exceeded (${hit + 1} requests this hour)` });

  try {
    const response = await GEMINI_AI.models.generateContent({
      model: AI_MODELS.image,
      contents: [{ role: 'user', parts: [{ text: imagePrompt.slice(0, 1000) }] }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData?.data) {
      return res.status(500).json({ error: 'AI did not return an image' });
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const fileName = `ai-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    if (!process.env.S3_BUCKET_NAME) {
      return res.status(500).json({ error: 'Storage not configured for image saving' });
    }

    const s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT?.startsWith('http')
        ? process.env.S3_ENDPOINT
        : `https://${process.env.S3_ENDPOINT}`,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: 'image/png',
    }));

    const finalUrl = buildPublicUrl(fileName);

    const asset = await prisma.mediaAsset.create({
      data: {
        workspaceId,
        userId,
        fileName: `AI-${Date.now()}.png`,
        fileUrl: finalUrl,
        fileType: 'image/png',
        fileSize: buffer.length,
        tags: ['ai-generated'],
      },
    });

    await logAiUsage(userId, 'image', imagePrompt, 0, 1);
    return res.json({ url: finalUrl, asset });
  } catch (error: any) {
    console.error('AI Image Error:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
