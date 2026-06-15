import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

const genAI = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
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

    if (genAI) {
      // Use Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are an expert social media manager. Generate 3 variations of a caption for ${platform} with a ${tone} tone. Return the response strictly as a JSON object with a "variations" key containing an array of strings.`;
      
      const result = await model.generateContent(`${systemPrompt}\n\nUser Request: ${prompt}`);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean up the text in case Gemini wraps it in markdown blocks
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        variations = parsed.variations || parsed.captions || Object.values(parsed)[0];
      } catch (e) {
        variations = [text];
      }
    } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      // Use OpenAI Fallback
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are an expert social media manager. Generate 3 variations of a caption for ${platform} with a ${tone} tone. Return the response strictly as a JSON array of strings.` },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });
      const responseText = completion.choices[0].message.content;
      try {
        const parsed = JSON.parse(responseText || '{}');
        variations = parsed.variations || parsed.captions || Object.values(parsed)[0];
      } catch (e) {
        variations = [responseText || ''];
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

    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are an SEO expert. Generate a list of top trending and contextually relevant hashtags for the given niche and keywords. Return strictly as a JSON object with a "hashtags" key containing an array of strings (including the # symbol).`;
      
      const result = await model.generateContent(`${systemPrompt}\n\nNiche: ${niche}, Keywords: ${keywords}`);
      const response = await result.response;
      const text = response.text();
      
      try {
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        hashtags = parsed.hashtags || Object.values(parsed)[0];
      } catch (e) {
        hashtags = text.split(' ').filter(word => word.startsWith('#'));
      }
    } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are an SEO expert. Generate a list of top trending and contextually relevant hashtags for the given niche/keywords. Return strictly as a JSON array of strings (including the # symbol).` },
          { role: 'user', content: `Niche: ${niche}, Keywords: ${keywords}` }
        ],
        response_format: { type: 'json_object' }
      });
      const responseText = completion.choices[0].message.content;
      try {
        const parsed = JSON.parse(responseText || '{}');
        hashtags = parsed.hashtags || Object.values(parsed)[0];
      } catch (e) {
        hashtags = [];
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

    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `Generate a 30-day social media content plan. Return JSON strictly in this format: { "ideas": [ { "day": 1, "topic": "...", "description": "..." } ] }`;
      
      const result = await model.generateContent(`${systemPrompt}\n\nTopic: ${topic}, Industry: ${industry}`);
      const response = await result.response;
      const text = response.text();
      
      try {
        const cleanedText = text.replace(/```json|```/g, '').trim();
        ideas = JSON.parse(cleanedText).ideas || [];
      } catch (e) {}
    } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Generate a 30-day content plan. Return JSON strictly in this format: { "ideas": [ { "day": 1, "topic": "...", "description": "..." } ] }` },
          { role: 'user', content: `Topic: ${topic}, Industry: ${industry}` }
        ],
        response_format: { type: 'json_object' }
      });
      const responseText = completion.choices[0].message.content;
      try {
        ideas = JSON.parse(responseText || '{}').ideas || [];
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

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
    return res.status(500).json({ error: 'Image generation requires OPENAI_API_KEY (DALL-E 3).' });
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
