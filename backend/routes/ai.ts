import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { Client } from '@google/genai';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fetch from 'node-fetch';
import { requireAuth } from '../middlewares/auth';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// Initialize AI Clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

const geminiClient = process.env.GOOGLE_AI_API_KEY 
  ? new Client({ apiKey: process.env.GOOGLE_AI_API_KEY })
  : null;

// Utility to log AI usage
const logAiUsage = async (userId: string, toolUsed: string, prompt: string, tokensUsed?: number, imagesGenerated?: number) => {
  try {
    await prisma.aiGenerationLog.create({
      data: {
        userId,
        toolUsed,
        prompt,
        tokensUsed: tokensUsed || 0,
        imagesGenerated: imagesGenerated || 0
      }
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
};

router.post('/caption', requireAuth, async (req: any, res: any) => {
  const { prompt, tone, platform } = req.body;
  const userId = req.userId;

  try {
    let variations: string[] = [];

    if (geminiClient) {
      // Use Gemini 3.1 via the new @google/genai SDK
      const response = await geminiClient.models.generateContent({
        model: 'gemini-1.5-flash', // Still use 1.5 for text, or 3.1 if available
        contents: [{ role: 'user', parts: [{ text: `You are an expert social media manager. Generate 3 variations of a caption for ${platform} with a ${tone} tone. Return the response strictly as a JSON object with a "variations" key containing an array of strings.\n\nUser Request: ${prompt}` }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      try {
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        variations = parsed.variations || parsed.captions || Object.values(parsed)[0];
      } catch (e) {
        variations = [text];
      }
    } else {
      return res.status(500).json({ error: 'AI services not configured. Please add GOOGLE_AI_API_KEY to your environment.' });
    }

    await logAiUsage(userId, 'caption', prompt);
    return res.json({ variations: Array.isArray(variations) ? variations : [variations] });

  } catch (error: any) {
    console.error('AI Caption Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate caption' });
  }
});

router.post('/hashtags', requireAuth, async (req: any, res: any) => {
  const { niche, keywords } = req.body;
  const userId = req.userId;

  try {
    let hashtags: string[] = [];

    if (geminiClient) {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. Generate a list of top trending and contextually relevant hashtags for the given niche and keywords. Return strictly as a JSON object with a "hashtags" key containing an array of strings (including the # symbol).\n\nNiche: ${niche}, Keywords: ${keywords}` }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      try {
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        hashtags = parsed.hashtags || Object.values(parsed)[0];
      } catch (e) {
        hashtags = text.split(' ').filter(word => word.startsWith('#'));
      }
    } else {
      return res.status(500).json({ error: 'AI services not configured.' });
    }

    await logAiUsage(userId, 'hashtags', `${niche} ${keywords}`);
    return res.json({ hashtags: Array.isArray(hashtags) ? hashtags : [] });

  } catch (error: any) {
    console.error('AI Hashtag Error:', error);
    res.status(500).json({ error: 'Failed to generate hashtags' });
  }
});

router.post('/ideas', requireAuth, async (req: any, res: any) => {
  const { topic, industry } = req.body;
  const userId = req.userId;

  try {
    let ideas = [];

    if (geminiClient) {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: `Generate a 30-day social media content plan. Return JSON strictly in this format: { "ideas": [ { "day": 1, "topic": "...", "description": "..." } ] }\n\nTopic: ${topic}, Industry: ${industry}` }] }],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      try {
        const cleanedText = text.replace(/```json|```/g, '').trim();
        ideas = JSON.parse(cleanedText).ideas || [];
      } catch (e) {}
    } else {
      return res.status(500).json({ error: 'AI services not configured.' });
    }

    await logAiUsage(userId, 'ideas', `${topic} ${industry}`);
    return res.json({ ideas });

  } catch (error: any) {
    console.error('AI Ideas Error:', error);
    res.status(500).json({ error: 'Failed to generate content plan' });
  }
});

router.post('/image', requireAuth, async (req: any, res: any) => {
  const { imagePrompt, aspectRatio } = req.body;
  const userId = req.userId;
  const workspaceId = req.workspaceId;

  if (!workspaceId) return res.status(404).json({ error: 'Workspace not found' });

  try {
    let finalUrl = '';
    let asset = null;

    if (geminiClient) {
      // --- Use Nano Banana (Gemini 3.1 Flash Image) ---
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.1-flash-image', // codenamed Nano Banana 2
        contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: "1K"
          }
        }
      });

      // Find the generated image part
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image was generated by Nano Banana');
      }

      const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const fileName = `ai-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      // Upload to Backblaze B2
      if (process.env.S3_BUCKET_NAME) {
        const s3Client = new S3Client({
          region: process.env.S3_REGION || 'us-east-1',
          endpoint: process.env.S3_ENDPOINT,
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

        finalUrl = process.env.S3_PUBLIC_URL 
          ? `${process.env.S3_PUBLIC_URL}/${fileName}` 
          : `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;

        // Register in Database
        asset = await prisma.mediaAsset.create({
          data: {
            workspaceId,
            userId,
            fileName: `NanoBanana-${Date.now()}.png`,
            fileUrl: finalUrl,
            fileType: 'image/png',
            fileSize: buffer.length,
            tags: ['nanobanana', 'ai-generated']
          }
        });

        await logAiUsage(userId, 'image', imagePrompt, 0, 1);
        return res.json({ url: finalUrl, asset });
      } else {
        throw new Error('Storage (Backblaze) not configured for image saving');
      }
    } else {
      return res.status(500).json({ error: 'Gemini AI not configured.' });
    }

  } catch (error: any) {
    console.error('Nano Banana Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image with Nano Banana' });
  }
});

export default router;
