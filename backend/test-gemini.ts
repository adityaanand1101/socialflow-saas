import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GOOGLE_AI_API_KEY || 'AIzaSyBu8loQuaFAbStm9QxyHBD82rKPgbjugNw';
const genAI = new GoogleGenAI({ apiKey });

async function runTests() {
  console.log("--- STARTING AI STUDIO DIAGNOSTICS ---");

  // 1. CAPTIONS
  console.log("\n1. Testing Caption Generation (gemini-2.0-flash)...");
  try {
    const res1 = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `You are an expert social media manager. Generate 3 variations of a caption for Instagram with a Professional tone. Return the response strictly as a JSON object with a "variations" key containing an array of strings.\n\nUser Request: Launching a new SaaS product` }] }],
    });
    console.log("✅ Success. Raw response snippet:", res1.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100).replace(/\n/g, ' '));
  } catch (e: any) { 
    console.error("❌ Caption Error:", e.message); 
  }

  // 2. HASHTAGS
  console.log("\n2. Testing Hashtag Generation (gemini-2.0-flash)...");
  try {
    const res2 = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. Generate a list of top trending and contextually relevant hashtags for the given niche and keywords. Return strictly as a JSON object with a "hashtags" key containing an array of strings (including the # symbol).\n\nNiche: SaaS, Keywords: startup, tech` }] }],
    });
    console.log("✅ Success. Raw response snippet:", res2.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100).replace(/\n/g, ' '));
  } catch (e: any) { 
    console.error("❌ Hashtag Error:", e.message); 
  }

  // 3. IDEAS
  console.log("\n3. Testing Idea Generation (gemini-2.0-flash)...");
  try {
    const res3 = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `Generate a 30-day social media content plan. Return JSON strictly in this format: { "ideas": [ { "day": 1, "topic": "...", "description": "..." } ] }\n\nTopic: SaaS, Industry: Tech` }] }],
    });
    console.log("✅ Success. Raw response snippet:", res3.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100).replace(/\n/g, ' '));
  } catch (e: any) { 
    console.error("❌ Idea Error:", e.message); 
  }

  // 4. IMAGE (NANO BANANA)
  console.log("\n4. Testing Image Generation (gemini-3.1-flash-image)...");
  try {
    const res4 = await genAI.models.generateContent({
      model: 'gemini-3.1-flash-image', // Nano Banana
      contents: [{ role: 'user', parts: [{ text: "A futuristic server rack glowing with neon blue lights, highly detailed, 4k" }] }],
      config: {
        responseModalities: ["IMAGE"] as any,
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        } as any
      }
    });
    const imagePart = res4.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
      console.log("✅ Success. Image data received (Base64 string length):", imagePart.inlineData.data.length);
    } else {
      console.log("❌ Failed to parse image data from response.");
    }
  } catch (e: any) { 
    console.error("❌ Image Error:", e.message); 
  }

  console.log("\n--- DIAGNOSTICS COMPLETE ---");
}

runTests();
