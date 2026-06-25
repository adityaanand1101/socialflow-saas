import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateJSON<T>(prompt: string, fallback: T): Promise<T> {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    return JSON.parse(text);
  } catch (err) {
    console.error("AI Generation Error:", err);
    return fallback;
  }
}

export const rewriteCaption = async (caption: string, tone: string = "professional"): Promise<string> => {
  const prompt = `Rewrite this social media caption to be more ${tone}. Keep it under 280 characters. Include 2-3 relevant hashtags. Return ONLY the rewritten caption text, no explanations.\n\nCaption: ${caption}`;
  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return caption;
  }
};

export const generateCaptions = async (prompt: string, tone: string, platform: string): Promise<string[]> => {
  const aiPrompt = `Generate 3 different ${tone} social media captions for ${platform} about: "${prompt}". 
Each caption should be platform-optimized, include relevant emojis and 2-3 hashtags.
Return ONLY a JSON array of 3 strings like: ["caption1", "caption2", "caption3"]`;
  return generateJSON<string[]>(aiPrompt, []);
};

export const generateHashtags = async (niche: string): Promise<string[]> => {
  const prompt = `Generate 20 trending and relevant hashtags for the niche: "${niche}".
Mix of popular (10M+ posts), mid-tier (1-10M), and niche-specific (<1M) hashtags.
Return ONLY a JSON array of 20 hashtag strings (with # symbol) like: ["#hashtag1", "#hashtag2"]`;
  return generateJSON<string[]>(prompt, []);
};

export const generateContentIdeas = async (topic: string): Promise<Array<{day: number, topic: string, description: string}>> => {
  const prompt = `Generate a 30-day content calendar for a brand focused on: "${topic}".
Return ONLY a JSON array of 30 objects like:
[{"day": 1, "topic": "Topic title", "description": "Brief 1-sentence description"}, ...]
Make each day unique with varied formats: tips, stories, polls, carousels, behind-the-scenes, etc.`;
  return generateJSON<Array<{day: number; topic: string; description: string}>>(prompt, []);
};

export const generateImage = async (imagePrompt: string): Promise<string> => {
  // Gemini 1.5 flash doesn't generate images directly. 
  // We return a message or handle via backend DALL-E 3 as implemented.
  console.warn("Client-side image generation not supported. Prompt:", imagePrompt);
  return "";
};
