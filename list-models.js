
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// Manually parse .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function listModels() {
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const models = await ai.models.list();
    if (models && models.models) {
      console.log("Available models:");
      models.models.forEach((m) => {
        console.log(`- ${m.name} (${m.displayName})`);
      });
    } else {
      console.log("No models property in response. Full response keys:", Object.keys(models));
      // In new SDK it might be an iterator
      for await (const m of models) {
         console.log(`- ${m.name} (${m.displayName})`);
      }
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
