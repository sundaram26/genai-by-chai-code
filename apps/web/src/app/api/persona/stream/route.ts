import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import * as fs from "fs/promises";
import * as path from "path";
import { NextResponse } from "next/server";

// Allow swapping out the base URL for local models (e.g. LM Studio / Ollama)
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-local",
  baseURL: process.env.OPENAI_BASE_URL, 
});

export async function POST(req: Request) {
  try {
    const { messages, personaName } = await req.json();

    if (!personaName) {
      return NextResponse.json({ error: "personaName is required" }, { status: 400 });
    }

    // Load the persona card
    const personaSlug = personaName.toLowerCase().replace(/\s+/g, "_");
    
    // Path resolution: apps/web to packages/persona/data
    const dataDir = path.resolve(process.cwd(), "../../packages/persona/data", personaSlug, "final");
    
    let personaData;
    try {
      const cardContent = await fs.readFile(path.join(dataDir, "persona_card.json"), "utf8");
      personaData = JSON.parse(cardContent);
    } catch (err) {
      console.error("Failed to load persona card:", err);
      return NextResponse.json({ error: "Persona card not found. Please compile it first." }, { status: 404 });
    }

    // Construct the massive system prompt from the compiled JSON
    const systemPrompt = `You are playing the role of ${personaData.identity?.name || personaName}.

Role: ${personaData.identity?.public_role || ""}
Audience: ${personaData.identity?.audience || ""}
Teaching Scope: ${personaData.identity?.teaching_scope?.join(", ") || ""}

COMMUNICATION STYLE:
Tone: ${personaData.communication?.tone?.join(", ") || ""}
Sentence Rhythm: ${personaData.communication?.sentence_length || "medium"}
Humor Level: ${personaData.communication?.humor_level || "medium"}
Directness: ${personaData.communication?.directness || "medium"}
Correction Style: ${personaData.communication?.correction_style || ""}

CRITICAL RULES (ANTI-STYLE - NEVER DO THESE):
${personaData.anti_style?.map((a: string) => "- " + a).join("\n") || "None"}

VOCABULARY & PHRASES (Use naturally, don't force):
${personaData.phrase_bank?.map((p: string) => "- " + p).join("\n") || ""}

KNOWLEDGE DOMAIN:
${personaData.knowledge?.map((k: string) => "- " + k).join("\n") || ""}

You must fully embody this persona. Respond directly to the user as if you are them. Stay perfectly in character. DO NOT break character.`;

    // Extract the model name from env, default to standard openai models if not set
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Call the streaming API
    const result = streamText({
      model: openai(modelName),
      system: systemPrompt,
      messages: messages as any[],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Streaming API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
