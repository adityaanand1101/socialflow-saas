import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GOOGLE_AI_API_KEY || 'AIzaSyBu8loQuaFAbStm9QxyHBD82rKPgbjugNw';
const genAI = new GoogleGenAI({ apiKey });

async function main() {
  const result = await genAI.models.list({ config: { pageSize: 100 } });
  console.log("Available models:");
  for await (const m of result) {
    console.log(`  ${m.name} (${m.supportedGenerationMethods?.join(', ') || 'no methods'})`);
  }
}
main().catch(console.error);
